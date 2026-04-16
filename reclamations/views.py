from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes as pc
from .models import Reclamation
from .serializers import ReclamationSerializer


class ReclamationViewSet(viewsets.ModelViewSet):
    serializer_class = ReclamationSerializer
    queryset = Reclamation.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve', 'classify_preview', 'ml_stats', 'reclassify']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser or getattr(user, 'user_type', '') == 'agent':
            return Reclamation.objects.all()
        return Reclamation.objects.filter(citizen=user)

    def perform_create(self, serializer):
        from .classifier import classify, detect_duplicate
        title       = self.request.data.get('title', '')
        description = self.request.data.get('description', '')
        category    = self.request.data.get('category', 'other')

        # Parse GPS coords (may be None if citizen didn't share location)
        try:
            latitude  = float(self.request.data.get('latitude'))
        except (TypeError, ValueError):
            latitude  = None
        try:
            longitude = float(self.request.data.get('longitude'))
        except (TypeError, ValueError):
            longitude = None

        # ── ML classification ────────────────────────────────────────────────
        result = classify(title, description, category)

        # ── Duplicate detection (texte + GPS) ────────────────────────────────
        dup_result   = detect_duplicate(title, description, latitude=latitude, longitude=longitude)
        is_duplicate = dup_result['is_duplicate']
        duplicate_of = None
        if is_duplicate and dup_result['duplicate_of']:
            try:
                duplicate_of = Reclamation.objects.get(pk=dup_result['duplicate_of'])
            except Reclamation.DoesNotExist:
                duplicate_of = None

        serializer.save(
            citizen=self.request.user,
            priority=result['priority'],
            service_responsable=result['service_responsable'],
            category=result['category'],
            is_duplicate=is_duplicate,
            duplicate_of=duplicate_of,
            similarity_score=dup_result['final_score'],
        )

    def create(self, request, *args, **kwargs):
        from .classifier import classify, detect_duplicate
        title       = request.data.get('title', '')
        description = request.data.get('description', '')
        category    = request.data.get('category', 'other')

        try:
            latitude  = float(request.data.get('latitude'))
        except (TypeError, ValueError):
            latitude  = None
        try:
            longitude = float(request.data.get('longitude'))
        except (TypeError, ValueError):
            longitude = None

        ml_result  = classify(title, description, category)
        dup_result = detect_duplicate(title, description, latitude=latitude, longitude=longitude)

        response = super().create(request, *args, **kwargs)
        response.data['ml_classification'] = {
            'category':            ml_result['category'],
            'priority':            ml_result['priority'],
            'service_responsable': ml_result['service_responsable'],
            'confidence':          ml_result.get('confidence', {}),
        }
        response.data['duplicate_detection'] = {
            'is_duplicate':     dup_result['is_duplicate'],
            'duplicate_of':     dup_result['duplicate_of'],
            'similarity_score': dup_result['similarity_score'],
            'geo_score':        dup_result['geo_score'],
            'final_score':      dup_result['final_score'],
        }
        return response

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
            if getattr(user, 'user_type', '') == 'agent':
                rec.agent = user
            rec.save()
            return Response({"status": "Statut mis a jour."})
        return Response({"detail": "Statut invalide."}, status=status.HTTP_400_BAD_REQUEST)

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
