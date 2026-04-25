from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes as pc
from .models import Reclamation
from .serializers import ReclamationSerializer
import logging
from django.core.mail import send_mail
from django.conf import settings
from notifications.models import Notification
logger = logging.getLogger(__name__)


class ReclamationViewSet(viewsets.ModelViewSet):
    serializer_class = ReclamationSerializer
    queryset = Reclamation.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve', 'classify_preview', 'ml_stats',
                           'reclassify', 'update_status', 'explain_text', 'explain_priority',
                           'nearby', 'geojson']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser or getattr(user, 'user_type', '') == 'agent':
            return Reclamation.objects.all()
        return Reclamation.objects.filter(citizen=user)

    def perform_create(self, serializer):

        title         = self.request.data.get('title', '')
        description   = self.request.data.get('description', '')
        category_hint = self.request.data.get('category', 'other')

        # GPS coords
        try:
            latitude  = float(self.request.data.get('latitude'))
        except (TypeError, ValueError):
            latitude  = None
        try:
            longitude = float(self.request.data.get('longitude'))
        except (TypeError, ValueError):
            longitude = None

        # ML Classification — safe fallback if models are missing or crash
        SERVICE_MAP_FALLBACK = {
            'lighting': 'Service Eclairage Public',
            'trash':    'Service Hygiene & Proprete',
            'roads':    'Service Voirie & Infrastructure',
            'noise':    'Service Ordre & Tranquillite',
            'other':    'Service Technique General',
        }
        ml_result = {
            'category':            category_hint if category_hint in SERVICE_MAP_FALLBACK else 'other',
            'priority':            'normale',
            'service_responsable': SERVICE_MAP_FALLBACK.get(category_hint, 'Service Technique General'),
            'confidence':          {},
        }
        try:
            from .classifier import classify
            ml_result = classify(title, description, category_hint)
        except Exception as e:
            logger.warning(f"ML classify() failed, using defaults: {e}")

        # Duplicate Detection — safe fallback
        dup_result = {'is_duplicate': False, 'duplicate_of': None, 'final_score': 0.0}
        try:
            from .classifier import detect_duplicate
            dup_result = detect_duplicate(title, description, latitude=latitude, longitude=longitude)
        except Exception as e:
            logger.warning(f"detect_duplicate() failed, skipping: {e}")

        is_duplicate = dup_result.get('is_duplicate', False)
        duplicate_of = None
        if is_duplicate and dup_result.get('duplicate_of'):
            try:
                from .models import Reclamation
                duplicate_of = Reclamation.objects.get(pk=dup_result['duplicate_of'])
            except Exception:
                duplicate_of = None

        # Save the instance
        instance = serializer.save(
            citizen=self.request.user,
            priority=ml_result.get('priority', 'normale'),
            service_responsable=ml_result.get('service_responsable', SERVICE_MAP_FALLBACK.get(category_hint, 'Service Technique General')),
            category=ml_result.get('category', category_hint),
            is_duplicate=is_duplicate,
            duplicate_of=duplicate_of,
            similarity_score=dup_result.get('final_score', 0.0),
        )

        # Attach results to the instance so create() can use them for response metadata
        instance._ml_result = ml_result
        instance._dup_result = dup_result

        # Notification for citizen
        try:
            Notification.objects.create(
                recipient=self.request.user,
                title="Nouveau signalement enregistré",
                message=f"Votre signalement '{instance.title}' a été enregistré avec succès.",
                notification_type='info',
                link='/mes-reclamations'
            )
        except Exception as e:
            logger.warning(f"Failed to create creation notification: {e}")

    def create(self, request, *args, **kwargs):
        # We let super().create handle the standard flow (which calls perform_create)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except Exception as e:
            import traceback
            logger.error(f"Creation failed: {e}\n{traceback.format_exc()}")
            return Response({"detail": f"Erreur serveur: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        instance = serializer.instance
        data = serializer.data
        
        # Add ML and Duplicate metadata to the response
        try:
            if hasattr(instance, '_ml_result'):
                ml_result = instance._ml_result
                data['ml_classification'] = {
                    'category':            ml_result.get('category', 'other'),
                    'priority':            ml_result.get('priority', 'normale'),
                    'service_responsable': ml_result.get('service_responsable', 'Service Technique Général'),
                    'confidence':          ml_result.get('confidence', {}),
                }
            
            if hasattr(instance, '_dup_result'):
                dup_result = instance._dup_result
                data['duplicate_detection'] = {
                    'is_duplicate':     dup_result.get('is_duplicate', False),
                    'duplicate_of':     dup_result.get('duplicate_of'),
                    'similarity_score': dup_result.get('similarity_score', 0.0),
                    'geo_score':        dup_result.get('geo_score', 0.0),
                    'final_score':      dup_result.get('final_score', 0.0),
                }
        except Exception as e:
            logger.error(f"Error enriching response with ML metadata: {e}")
            # Non-fatal: original data still valid
            
        headers = self.get_success_headers(data)
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)

    # ── classify_preview ──────────────────────────────────────────────────────
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def classify_preview(self, request):
        """POST /api/reclamations/classify_preview/ — ML preview without saving."""
        from .classifier import classify
        title       = request.data.get('title', '')
        description = request.data.get('description', '')
        category    = request.data.get('category', 'other')
        if not title and not description:
            return Response({"detail": "title or description is required."}, status=status.HTTP_400_BAD_REQUEST)
        result = classify(title, description, category)
        return Response({
            "category":            result['category'],
            "priority":            result['priority'],
            "service_responsable": result['service_responsable'],
            "confidence":          result.get('confidence', {}),
        })

    # ── reclassify (manual override by agent) ────────────────────────────────
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reclassify(self, request, pk=None):
        """
        POST /api/reclamations/{id}/reclassify/
        Body: { "category": "roads", "priority": "urgente" }   (both optional)

        Allows an agent to manually override the ML classification.
        Also recomputes service_responsable from the new category.
        """
        rec  = self.get_object()
        user = request.user
        if not (user.is_staff or user.is_superuser or getattr(user, 'user_type', '') == 'agent'):
            return Response({"detail": "Non autorise."}, status=status.HTTP_403_FORBIDDEN)

        SERVICE_MAP = {
            'lighting': 'Service Eclairage Public',
            'trash':    'Service Hygiene & Proprete',
            'roads':    'Service Voirie & Infrastructure',
            'noise':    'Service Ordre & Tranquillite',
            'other':    'Service Technique General',
        }
        valid_cats   = [c[0] for c in Reclamation.CATEGORY_CHOICES]
        valid_prios  = [p[0] for p in Reclamation.PRIORITY_CHOICES]

        new_cat  = request.data.get('category')
        new_prio = request.data.get('priority')

        if new_cat and new_cat not in valid_cats:
            return Response({"detail": f"Categorie invalide. Valeurs: {valid_cats}"}, status=status.HTTP_400_BAD_REQUEST)
        if new_prio and new_prio not in valid_prios:
            return Response({"detail": f"Priorite invalide. Valeurs: {valid_prios}"}, status=status.HTTP_400_BAD_REQUEST)

        changed = []
        if new_cat:
            rec.category = new_cat
            rec.service_responsable = SERVICE_MAP.get(new_cat, 'Service Technique General')
            changed.append('category')
        if new_prio:
            rec.priority = new_prio
            changed.append('priority')

        if changed:
            rec.save(update_fields=changed + (['service_responsable'] if 'category' in changed else []))

        return Response({
            "id":                  rec.id,
            "category":            rec.category,
            "priority":            rec.priority,
            "service_responsable": rec.service_responsable,
            "updated_fields":      changed,
        })

    # ── update_status ─────────────────────────────────────────────────────────
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_status(self, request, pk=None):
        rec  = self.get_object()
        user = request.user
        if not (user.is_staff or user.is_superuser or getattr(user, 'user_type', '') == 'agent'):
            return Response({"detail": "Non autorise."}, status=status.HTTP_403_FORBIDDEN)
        new_status = request.data.get('status')
        if new_status in dict(Reclamation.STATUS_CHOICES):
            rec.status = new_status
            if getattr(user, 'user_type', '') == 'agent' and rec.agent is None:
                rec.agent = user
            rec.save()
            
            # --- Send Notifications ---
            try:
                # 1. In-app notification (synchronous — fast DB write)
                Notification.objects.create(
                    recipient=rec.citizen,
                    title=f"Mise à jour de votre signalement: {rec.title}",
                    message=f"Le statut de votre signalement '{rec.title}' est passé à : {rec.get_status_display()}.",
                    notification_type='success' if new_status == 'resolved' else 'info',
                    link='/mes-reclamations'
                )

                # 2. Email notification — run in background thread to avoid timeout
                if settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD:
                    import threading
                    citizen_name = rec.citizen.first_name
                    citizen_email = rec.citizen.email
                    rec_title = rec.title
                    status_display = rec.get_status_display()
                    from_email = settings.DEFAULT_FROM_EMAIL
                    def _send_status_email():
                        try:
                            subject = f"Mise à jour de votre signalement - Kelibia Smart City"
                            msg = f"Bonjour {citizen_name},\n\nLe statut de votre signalement '{rec_title}' a été mis à jour.\nNouveau statut : {status_display}.\n\nVous pouvez suivre l'évolution sur l'application.\n\nCordialement,\nL'équipe Kelibia Smart City"
                            send_mail(subject, msg, from_email, [citizen_email], fail_silently=True)
                        except Exception as ex:
                            logger.error(f"Background email send failed: {ex}")
                    threading.Thread(target=_send_status_email).start()
            except Exception as e:
                logger.error(f"Error sending notifications: {e}")

            return Response({"status": "Statut mis a jour."})
        return Response({"detail": "Statut invalide."}, status=status.HTTP_400_BAD_REQUEST)

    # ── assign_agent (Supervisor only) ───────────────────────────────────────
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def assign_agent(self, request, pk=None):
        """
        POST /api/reclamations/{id}/assign_agent/
        Body: { "agent_id": 123 }
        """
        rec  = self.get_object()
        user = request.user
        # Only supervisors or staff can assign agents
        if not (user.is_staff or user.is_superuser or getattr(user, 'user_type', '') == 'supervisor'):
            return Response({"detail": "Seuls les superviseurs peuvent affecter des agents."}, status=status.HTTP_403_FORBIDDEN)
        
        agent_id = request.data.get('agent_id')
        if not agent_id:
            return Response({"detail": "ID de l'agent requis."}, status=status.HTTP_400_BAD_REQUEST)
        
        from accounts.models import CustomUser
        try:
            agent = CustomUser.objects.get(pk=agent_id, user_type='agent')
            rec.agent = agent
            rec.save()
            return Response({"status": f"Agent {agent.first_name} {agent.last_name} affecté avec succès."})
        except CustomUser.DoesNotExist:
            return Response({"detail": "Agent introuvable ou n'est pas un agent municipal."}, status=status.HTTP_404_NOT_FOUND)

    # ── ml_stats ──────────────────────────────────────────────────────────────
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def ml_stats(self, request):
        """
        GET /api/reclamations/ml_stats/

        Returns the 3 ML classification tables your supervisor asked for:
          1. confusion_matrix  — rows=actual, cols=predicted, counts
          2. classification_report — precision / recall / f1 per category & priority
          3. top_features — top 8 discriminative words per category
        Computed live on real DB data using the trained models.
        """
        import traceback
        try:
            from .classifier import _load_models, _normalize
            from .training_data import TRAINING_DATA
            from sklearn.metrics import confusion_matrix, precision_recall_fscore_support
            import numpy as np
        except ImportError as e:
            return Response({"error": f"ML packages not available: {e}"}, status=503)

        try:
            cat_model, prio_model = _load_models()
        except Exception as e:
            return Response({"error": f"Model loading failed: {e}\n{traceback.format_exc()}"}, status=500)

        try:
            # ── Build eval dataset ───────────────────────────────────────────
            texts      = [_normalize(t) for t, _, _ in TRAINING_DATA]
            categories = [c for _, c, _ in TRAINING_DATA]
            priorities = [p for _, _, p in TRAINING_DATA]

            cat_labels  = sorted(set(categories))
            prio_labels = ['faible', 'normale', 'urgente']

            cat_pred  = cat_model.predict(texts).tolist()
            prio_pred = prio_model.predict(texts).tolist()

            # ── 1. Confusion matrices ────────────────────────────────────────
            cm_cat  = confusion_matrix(categories, cat_pred,  labels=cat_labels).tolist()
            cm_prio = confusion_matrix(priorities, prio_pred, labels=prio_labels).tolist()

            # ── 2. Classification reports ────────────────────────────────────
            p_cat, r_cat, f_cat, s_cat = precision_recall_fscore_support(
                categories, cat_pred, labels=cat_labels, zero_division=0)
            p_prio, r_prio, f_prio, s_prio = precision_recall_fscore_support(
                priorities, prio_pred, labels=prio_labels, zero_division=0)

            cat_report = [
                {"label": lbl, "precision": round(float(p_cat[i]), 3),
                 "recall": round(float(r_cat[i]), 3), "f1": round(float(f_cat[i]), 3),
                 "support": int(s_cat[i])}
                for i, lbl in enumerate(cat_labels)
            ]
            prio_report = [
                {"label": lbl, "precision": round(float(p_prio[i]), 3),
                 "recall": round(float(r_prio[i]), 3), "f1": round(float(f_prio[i]), 3),
                 "support": int(s_prio[i])}
                for i, lbl in enumerate(prio_labels)
            ]

            # ── 3. Top features per category ─────────────────────────────────
            top_features = {}
            try:
                tfidf    = cat_model.named_steps['tfidf']
                clf      = cat_model.named_steps['clf']
                base_clf = clf.calibrated_classifiers_[0].estimator
                feature_names = tfidf.get_feature_names_out()
                for i, cls in enumerate(base_clf.classes_):
                    coef = base_clf.coef_[i]
                    top_idx = np.argsort(coef)[::-1][:8]
                    top_features[cls] = [
                        {"word": feature_names[j], "score": round(float(coef[j]), 3)}
                        for j in top_idx
                    ]
            except Exception:
                top_features = {}

            # ── 3b. Top features per priority (SHAP for priority model) ──────
            prio_top_features = {}
            try:
                tfidf_p    = prio_model.named_steps['tfidf']
                clf_p      = prio_model.named_steps['clf']
                base_clf_p = clf_p.calibrated_classifiers_[0].estimator
                feat_names_p = tfidf_p.get_feature_names_out()
                for i, cls in enumerate(base_clf_p.classes_):
                    coef = base_clf_p.coef_[i]
                    top_idx = np.argsort(coef)[::-1][:8]
                    prio_top_features[cls] = [
                        {"word": feat_names_p[j], "score": round(float(coef[j]), 3)}
                        for j in top_idx
                    ]
            except Exception:
                prio_top_features = {}

            # ── 4. Overall accuracy ──────────────────────────────────────────
            correct_cat  = sum(1 for a, b in zip(categories, cat_pred)  if a == b)
            correct_prio = sum(1 for a, b in zip(priorities, prio_pred) if a == b)
            n = len(texts)

            return Response({
                "n_samples": n,
                "category": {
                    "labels":           cat_labels,
                    "accuracy":         round(correct_cat / n, 3),
                    "confusion_matrix": cm_cat,
                    "report":           cat_report,
                    "top_features":     top_features,
                },
                "priority": {
                    "labels":           prio_labels,
                    "accuracy":         round(correct_prio / n, 3),
                    "confusion_matrix": cm_prio,
                    "report":           prio_report,
                    "top_features":     prio_top_features,
                },
            })
        except Exception as e:
            return Response({"error": f"Stats computation failed: {e}\n{traceback.format_exc()}"}, status=500)



    # ── explain_text (LIME + SHAP for free text — AI stats page demo) ──────────
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def explain_text(self, request):
        """
        POST /api/reclamations/explain_text/
        Body: { "title": "...", "description": "..." }

        Returns LIME + SHAP word-level explanations for free text input.
        Used by the AI stats page live demo. Agents/staff only.
        """
        user = request.user
        if not (user.is_staff or user.is_superuser or getattr(user, 'user_type', '') in ('agent', 'supervisor')):
            return Response({"detail": "Non autorisé."}, status=status.HTTP_403_FORBIDDEN)

        title       = request.data.get('title', '')
        description = request.data.get('description', '')
        if not title and not description:
            return Response({"detail": "title or description is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from .classifier import explain_priority
        except ImportError as e:
            return Response({"error": f"ML packages not available: {e}"}, status=503)

        try:
            result = explain_priority(title, description)
            return Response(result)
        except Exception as exc:
            import traceback
            return Response({"error": str(exc), "traceback": traceback.format_exc()}, status=500)

    # ── explain_priority (LIME + SHAP for agents) ────────────────────────────
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def explain_priority(self, request, pk=None):
        """
        GET /api/reclamations/{id}/explain_priority/

        Returns LIME + SHAP word-level explanations for why the AI assigned
        a specific priority (faible / normale / urgente) to this reclamation.
        Accessible to agents, staff, and superusers only.
        """
        user = request.user
        if not (user.is_staff or user.is_superuser or getattr(user, 'user_type', '') == 'agent'):
            return Response({"detail": "Non autorisé. Réservé aux agents municipaux."}, status=status.HTTP_403_FORBIDDEN)

        rec = self.get_object()

        try:
            from .classifier import explain_priority
        except ImportError as e:
            return Response({"error": f"ML packages not available: {e}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            result = explain_priority(rec.title, rec.description or '')
            return Response({
                "reclamation_id":     rec.id,
                "reclamation_title":  rec.title,
                "stored_priority":    rec.priority,   # what is saved in DB
                **result,             # predicted_priority, confidence, probabilities, lime, shap, errors
            })
        except Exception as exc:
            import traceback
            return Response(
                {"error": f"Explanation failed: {exc}", "traceback": traceback.format_exc()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    # ── nearby (PostGIS optimized) ───────────────────────────────────────────
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def nearby(self, request):
        """
        GET /api/reclamations/nearby/?lat=...&lon=...&radius=1000
        Returns reclamations within X meters using PostGIS ST_DWithin.
        """
        try:
            lat      = float(request.query_params.get('lat'))
            lon      = float(request.query_params.get('lon'))
            radius_m = float(request.query_params.get('radius', 1000))
        except (TypeError, ValueError):
            return Response(
                {"detail": "Les paramètres 'lat', 'lon' et 'radius' (optionnel, en mètres) sont requis et doivent être numériques."},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.db import connection
        with connection.cursor() as cursor:
            # Query spatiale optimisée : ST_DWithin utilise l'index GIST
            # ST_Distance (geography) renvoie la distance précise en mètres
            query = """
                SELECT id, ST_Distance(
                    ST_MakePoint(longitude, latitude)::geography,
                    ST_MakePoint(%s, %s)::geography
                ) as dist_m
                FROM reclamations_reclamation
                WHERE ST_DWithin(
                    ST_MakePoint(longitude, latitude)::geography,
                    ST_MakePoint(%s, %s)::geography,
                    %s
                ) AND status != 'rejected'
                ORDER BY dist_m
                LIMIT 50;
            """
            cursor.execute(query, [lon, lat, lon, lat, radius_m])
            rows = cursor.fetchall()

        if not rows:
            return Response([])

        ids      = [r[0] for r in rows]
        dist_map = {r[0]: r[1] for r in rows}

        reclamations = Reclamation.objects.filter(id__in=ids)
        serializer   = self.get_serializer(reclamations, many=True)

        for data in serializer.data:
            data['distance_m'] = round(dist_map.get(data['id'], 0), 1)

        # Trier par distance (le queryset perd l'ordre SQL)
        sorted_data = sorted(serializer.data, key=lambda x: x['distance_m'])
        return Response(sorted_data)

    # ── geojson export (QGIS-compatible, sans GeoDjango/GDAL) ────────────────
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def geojson(self, request):
        """
        GET /api/reclamations/geojson/

        Retourne un GeoJSON FeatureCollection compatible QGIS/Leaflet.
        Params optionnels:
          ?status=pending|in_progress|resolved|rejected
          ?category=lighting|trash|roads|noise|other
          ?priority=faible|normale|urgente
          ?has_coords=true          (exclut les réclamations sans coordonnées)
          ?bbox=minLon,minLat,maxLon,maxLat  (WGS-84, degrés décimaux)

        Content-Type: application/geo+json (RFC 7946)
        Aucune dépendance GDAL/GeoDjango — fonctionne sur Vercel.
        """
        import json
        from django.http import HttpResponse
        from .serializers import ReclamationGeoJSONSerializer

        user = request.user
        if user.is_staff or user.is_superuser or getattr(user, 'user_type', '') == 'agent':
            qs = Reclamation.objects.all()
        else:
            qs = Reclamation.objects.filter(citizen=user)

        # ── Filtres optionnels ────────────────────────────────────────────────
        status_param   = request.query_params.get('status')
        category_param = request.query_params.get('category')
        priority_param = request.query_params.get('priority')
        bbox_param     = request.query_params.get('bbox')
        has_coords     = request.query_params.get('has_coords', '').lower() == 'true'

        valid_statuses   = [c[0] for c in Reclamation.STATUS_CHOICES]
        valid_categories = [c[0] for c in Reclamation.CATEGORY_CHOICES]
        valid_priorities = [c[0] for c in Reclamation.PRIORITY_CHOICES]

        if status_param:
            if status_param not in valid_statuses:
                return Response({"detail": f"Statut invalide. Valeurs acceptées: {valid_statuses}"}, status=400)
            qs = qs.filter(status=status_param)

        if category_param:
            if category_param not in valid_categories:
                return Response({"detail": f"Catégorie invalide. Valeurs acceptées: {valid_categories}"}, status=400)
            qs = qs.filter(category=category_param)

        if priority_param:
            if priority_param not in valid_priorities:
                return Response({"detail": f"Priorité invalide. Valeurs acceptées: {valid_priorities}"}, status=400)
            qs = qs.filter(priority=priority_param)

        if has_coords:
            qs = qs.filter(latitude__isnull=False, longitude__isnull=False)

        if bbox_param:
            try:
                parts = [float(x.strip()) for x in bbox_param.split(',')]
                if len(parts) != 4:
                    raise ValueError("4 valeurs requises")
                min_lon, min_lat, max_lon, max_lat = parts
                if not (-180 <= min_lon <= 180 and -180 <= max_lon <= 180):
                    raise ValueError("Longitude hors plage [-180, 180]")
                if not (-90 <= min_lat <= 90 and -90 <= max_lat <= 90):
                    raise ValueError("Latitude hors plage [-90, 90]")
                if min_lon > max_lon or min_lat > max_lat:
                    raise ValueError("min doit être inférieur à max")
            except ValueError as e:
                return Response(
                    {"detail": f"Paramètre bbox invalide: {e}. Format: minLon,minLat,maxLon,maxLat"},
                    status=400
                )
            qs = qs.filter(
                longitude__gte=min_lon, longitude__lte=max_lon,
                latitude__gte=min_lat,  latitude__lte=max_lat,
            )

        # ── Sérialisation GeoJSON ─────────────────────────────────────────────
        qs = qs.select_related('citizen')
        serializer = ReclamationGeoJSONSerializer(qs, many=True)

        feature_collection = {
            "type": "FeatureCollection",
            "features": serializer.data,
            "metadata": {
                "count": len(serializer.data),
                "filters": {
                    "status":     status_param,
                    "category":   category_param,
                    "priority":   priority_param,
                    "bbox":       bbox_param,
                    "has_coords": has_coords,
                },
            },
        }

        content = json.dumps(feature_collection, ensure_ascii=False)
        return HttpResponse(content, content_type='application/geo+json; charset=utf-8')
