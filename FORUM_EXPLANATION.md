# Explication Détaillée — Forum Citoyen (Kelibia Smart City)

---

## 🗄️ BACKEND DJANGO — `forum/`

---

### 📄 `forum/models.py` — Les 5 modèles de données

#### `class Tag`
```python
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
```
Un **tag** est simplement un mot-clé (ex: "voirie", "eau", "écoles").
- `unique=True` : impossible d'avoir deux tags avec le même nom, évite les doublons.
- `ordering = ['name']` : les tags sont triés alphabétiquement.

---

#### `class Topic` (le sujet du forum)
```python
title       = models.CharField(max_length=200)
content     = models.TextField()
category    = models.CharField(choices=CATEGORY_CHOICES, default='questions')
author      = models.ForeignKey(User, related_name='forum_topics')
tags        = models.ManyToManyField('Tag', blank=True)
is_pinned   = models.BooleanField(default=False)
is_resolved = models.BooleanField(default=False)
views       = models.PositiveIntegerField(default=0)
created_at  = models.DateTimeField(auto_now_add=True)
updated_at  = models.DateTimeField(auto_now=True)
```

Chaque champ a sa raison :
- `title` + `content` : le texte du sujet.
- `category` avec `CATEGORY_CHOICES` : limite les valeurs à 3 options (`questions`, `suggestions`, `debates`). Django valide automatiquement.
- `author = ForeignKey(User)` : chaque sujet appartient à un utilisateur. `on_delete=CASCADE` → si l'utilisateur est supprimé, tous ses sujets disparaissent aussi. `related_name='forum_topics'` permet d'écrire `user.forum_topics.all()`.
- `tags = ManyToManyField` : un sujet peut avoir plusieurs tags, et un tag peut appartenir à plusieurs sujets. C'est une relation "plusieurs à plusieurs" — Django crée automatiquement une table intermédiaire.
- `is_pinned` : mis à `True` par un agent pour épingler un sujet important en haut de la liste.
- `is_resolved` : mis à `True` par un agent quand le problème est résolu.
- `views` : compteur incrémenté à chaque visite de la page détail.
- `auto_now_add` : rempli automatiquement à la création. `auto_now` : mis à jour automatiquement à chaque modification.
- `ordering = ['-is_pinned', '-created_at']` : les sujets épinglés apparaissent toujours en premier, puis triés par date décroissante.

Les **propriétés** calculées :
```python
@property
def replies_count(self):
    return self.replies.count()

@property
def votes_count(self):
    return self.votes.filter(topic=self).count()
```
`@property` transforme une méthode en attribut accessible comme `topic.replies_count`. Ces valeurs sont calculées à la demande depuis la base de données, sans les stocker (évite les désynchronisations).

---

#### `class Reply` (les réponses)
```python
topic      = models.ForeignKey(Topic, related_name='replies')
author     = models.ForeignKey(User, related_name='forum_replies')
content    = models.TextField()
created_at = models.DateTimeField(auto_now_add=True)
```
Simple : une réponse appartient à un sujet (`topic`) et à un auteur (`author`). `ordering = ['created_at']` → les réponses sont affichées du plus ancien au plus récent (ordre chronologique naturel).

---

#### `class Vote` (le système de likes/upvotes)
```python
user   = models.ForeignKey(User, related_name='forum_votes')
topic  = models.ForeignKey(Topic, null=True, blank=True)
reply  = models.ForeignKey(Reply, null=True, blank=True)

constraints = [
    UniqueConstraint(fields=['user', 'topic'], condition=Q(topic__isnull=False), name='unique_user_topic_vote'),
    UniqueConstraint(fields=['user', 'reply'], condition=Q(reply__isnull=False), name='unique_user_reply_vote'),
]
```

Pourquoi une seule table `Vote` pour les topics ET les replies ? C'est un **design polymorphique partiel** : au lieu d'avoir deux tables séparées (`TopicVote`, `ReplyVote`), on a une seule table avec deux ForeignKeys optionnelles.

Les `UniqueConstraint` avec `condition` sont des **contraintes partielles** (PostgreSQL uniquement) :
- "Un utilisateur ne peut voter qu'une seule fois sur un topic donné" — mais seulement si `topic` n'est pas NULL.
- "Un utilisateur ne peut voter qu'une seule fois sur une reply donnée" — mais seulement si `reply` n'est pas NULL.

Sans la condition, une contrainte unique sur `(user, topic)` bloquerait tous les votes sur les replies (parce que `topic` serait NULL pour tous).

---

#### `class Notification`
```python
recipient  = models.ForeignKey(User, related_name='forum_notifications')
topic      = models.ForeignKey(Topic)
reply      = models.ForeignKey(Reply, null=True, blank=True)
is_read    = models.BooleanField(default=False)
created_at = models.DateTimeField(auto_now_add=True)
```
Créée automatiquement quand quelqu'un répond à un sujet. `is_read` commence à `False` → permet de compter les notifications non lues pour le badge rouge.

---

### 📄 `forum/serializers.py` — Transformer les objets Python en JSON

#### `TagSerializer`
Simple : juste l'`id` et le `name`.

#### `AuthorSerializer`
Expose `id`, `first_name`, `last_name`, `email`, et surtout **`user_type`** — c'est crucial pour afficher le badge "Agent Municipal" dans le frontend.

#### `ReplySerializer`
```python
has_voted = serializers.SerializerMethodField()

def get_has_voted(self, obj):
    request = self.context.get('request')
    if not request or not request.user.is_authenticated:
        return False
    return Vote.objects.filter(user=request.user, reply=obj).exists()
```
`SerializerMethodField` est un champ calculé — son contenu est défini dans la méthode `get_has_voted()`. Il vérifie si l'utilisateur **qui fait la requête** a déjà voté sur cette reply. Le `context={'request': request}` est passé depuis la view pour accéder à `request.user`.

#### `TopicListSerializer` vs `TopicDetailSerializer`
Deux sérialiseurs différents pour deux usages :
- **List** : pour la liste des topics, on n'envoie pas le `content` complet (économise la bande passante) mais on inclut `replies_count`, `votes_count`, `has_voted`.
- **Detail** : pour la page d'un topic précis, on ajoute `content` + la liste complète des `replies` imbriqués.

```python
replies = ReplySerializer(many=True, read_only=True)
```
`many=True` : sérialise une liste d'objets. `read_only=True` : ce champ n'est utilisé qu'en lecture (on ne peut pas créer des replies via ce sérialiseur).

#### `TopicCreateSerializer`
```python
tag_names = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)

def create(self, validated_data):
    tag_names = validated_data.pop('tag_names', [])
    topic = Topic.objects.create(**validated_data)
    for name in tag_names:
        name = name.strip().lower()
        if name:
            tag, _ = Tag.objects.get_or_create(name=name)
            topic.tags.add(tag)
    return topic
```
`write_only=True` : envoyé par le client mais jamais retourné dans la réponse. `get_or_create` : crée le tag s'il n'existe pas, ou récupère l'existant — évite les doublons. `validated_data.pop('tag_names', [])` : retire ce champ avant de passer au `Topic.objects.create()` (parce que `tag_names` n'est pas un champ du modèle).

---

### 📄 `forum/permissions.py`
```python
class IsAgentOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.user_type == 'agent' or request.user.is_staff
        )
```
DRF vérifie cette classe avant d'exécuter la view. Si `has_permission()` retourne `False`, la requête reçoit automatiquement un `403 Forbidden`. Utilisée sur les actions `pin` et `resolve`.

---

### 📄 `forum/signals.py`
```python
@receiver(post_save, sender=Reply)
def create_reply_notification(sender, instance, created, **kwargs):
    if created and instance.topic.author != instance.author:
        Notification.objects.create(
            recipient=instance.topic.author,
            topic=instance.topic,
            reply=instance
        )
```
Un **signal Django** est comme un événement : "quand cette action se produit, fais quelque chose automatiquement".

- `post_save` : déclenché après chaque `save()` sur le modèle `Reply`.
- `created=True` : seulement lors de la création (pas des modifications).
- `instance.topic.author != instance.author` : on n'envoie pas de notification à quelqu'un qui répond à son propre sujet.

Pour que les signaux soient chargés au démarrage, `apps.py` fait :
```python
def ready(self):
    import forum.signals
```
`ready()` est appelé une seule fois quand Django initialise l'application.

---

### 📄 `forum/views.py` — L'API REST

#### `TopicViewSet`
Hérite de `ModelViewSet` qui fournit automatiquement `list`, `create`, `retrieve`, `update`, `partial_update`, `destroy`.

**`get_queryset()`** : filtre dynamiquement selon les paramètres de l'URL :
```
GET /api/forum/topics/?category=questions&tag=eau&search=fuite
```
`Q(title__icontains=search) | Q(content__icontains=search)` : cherche dans le titre **OU** le contenu (opérateur OR de Django ORM).

`prefetch_related('tags', 'replies', 'votes')` et `select_related('author')` : optimisation critique. Sans ces appels, Django ferait une requête SQL séparée pour chaque topic pour récupérer ses tags, ses replies, etc. (problème N+1). Avec `prefetch_related`, il fait une seule requête groupée.

**`retrieve()`** : surcharge la méthode de base pour incrémenter le compteur de vues :
```python
Topic.objects.filter(pk=instance.pk).update(views=instance.views + 1)
```
`update()` fait une seule requête SQL atomique, plus efficace que `instance.views += 1; instance.save()`.

**`vote_topic()`** — le pattern toggle :
```python
vote, created = Vote.objects.get_or_create(user=request.user, topic=topic)
if not created:
    vote.delete()
    return Response({'voted': False})
return Response({'voted': True})
```
`get_or_create` retourne `(objet, True)` si créé, ou `(objet, False)` s'il existait déjà. Si le vote existait déjà → on le supprime (toggle off). Sinon → on le garde (toggle on). Un seul endpoint `/vote/` gère les deux cas.

**`@action` decorator** :
```python
@action(detail=True, methods=['post'], url_path='reply')
def add_reply(self, request, pk=None):
```
`detail=True` : l'action s'applique à un objet spécifique (besoin d'un `pk` dans l'URL). `url_path='reply'` : génère l'URL `/api/forum/topics/{pk}/reply/`.

---

### 📄 `forum/urls.py`
```python
router = DefaultRouter()
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'replies', ReplyViewSet, basename='reply')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'stats', ForumStatsView, basename='forum-stats')
```
`DefaultRouter` génère automatiquement toutes les URLs RESTful pour chaque ViewSet. Par exemple, pour `topics` :
- `GET /api/forum/topics/` → liste
- `POST /api/forum/topics/` → créer
- `GET /api/forum/topics/1/` → détail
- `POST /api/forum/topics/1/reply/` → action custom
- `POST /api/forum/topics/1/vote/` → action custom
- `POST /api/forum/topics/1/pin/` → action custom

---

## ⚛️ FRONTEND REACT TYPESCRIPT

---

### 📄 `ForumPage.tsx` — La liste des topics

#### Architecture des interfaces TypeScript
```typescript
interface Author { id: number; first_name: string; last_name: string; user_type: string }
interface Topic {
  id: number; title: string; category: string; author: Author; tags: Tag[]
  is_pinned: boolean; is_resolved: boolean; views: number
  replies_count: number; votes_count: number; has_voted: boolean; created_at: string
}
```
Ces interfaces définissent exactement la forme des données retournées par l'API Django. TypeScript vérifie à la compilation que ton code utilise les bons champs avec les bons types — si tu essaies d'accéder à `topic.nonExistent`, TypeScript te prévient immédiatement.

#### Chargement des données avec `useEffect`
```typescript
useEffect(() => {
  const access = getAccessToken()
  if (!access) { navigate('/login'); return }

  Promise.all([
    fetch('/api/forum/topics/', { headers: { Authorization: `Bearer ${access}` } }).then(r => r.json()),
    fetch('/api/forum/stats/stats/', ...).then(r => r.json()),
    fetch('/api/forum/tags/', ...).then(r => r.json()),
    fetch('/api/forum/notifications/', ...).then(r => r.json()),
  ]).then(([topicsData, statsData, tagsData, notifsData]) => {
    setTopics(topicsData)
    setStats(statsData)
    // ...
  })
}, [navigate])
```
`Promise.all()` : lance les 4 requêtes **en parallèle** plutôt qu'en séquence — beaucoup plus rapide. `useEffect` avec `[navigate]` comme dépendance : s'exécute une seule fois au montage du composant.

#### Filtrage côté client
```typescript
const filtered = topics
  .filter(t => !activeCategory || t.category === activeCategory)
  .filter(t => !activeTag || t.tags.some(tg => tg.name === activeTag))
  .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))
```
Les filtres sont chaînés avec `.filter()`. `tags.some()` vérifie si au moins un tag du sujet correspond au filtre sélectionné.

#### Toggle vote avec mise à jour optimiste
```typescript
const handleVoteTopic = async (topicId: number) => {
  const res = await fetch(`/api/forum/topics/${topicId}/vote/`, { method: 'POST', ... })
  const data = await res.json()
  setTopics(prev => prev.map(t => t.id === topicId
    ? { ...t, has_voted: data.voted, votes_count: data.votes_count }
    : t
  ))
}
```
`setTopics(prev => prev.map(...))` : la syntaxe fonctionnelle garantit qu'on travaille sur la dernière version du state. `{ ...t, has_voted: data.voted }` : spread operator → copie toutes les propriétés de `t` et écrase seulement `has_voted` et `votes_count`. **Immutabilité** : on ne modifie jamais directement l'objet existant, on en crée un nouveau — requis par React pour détecter les changements.

#### Modal de création de sujet
```typescript
const [showModal, setShowModal] = useState(false)
const [newTopic, setNewTopic] = useState({ title: '', category: 'questions', content: '', tags: '' })
```
L'état du formulaire est un seul objet avec tous les champs. Quand on soumet :
```typescript
body: JSON.stringify({
  title: newTopic.title,
  category: newTopic.category,
  content: newTopic.content,
  tag_names: newTopic.tags.split(',').map(t => t.trim()).filter(Boolean)
})
```
`.split(',').map(t => t.trim()).filter(Boolean)` : transforme la chaîne `"eau, voirie, lumière"` en tableau `["eau", "voirie", "lumière"]`, en supprimant les espaces et les entrées vides.

---

### 📄 `ForumTopicPage.tsx` — La page détail d'un topic

#### Récupération de l'ID depuis l'URL
```typescript
const { id } = useParams<{ id: string }>()
```
`useParams` extrait les paramètres de l'URL. Pour `/forum/42`, `id` vaut `"42"`. TypeScript générique `<{ id: string }>` indique le type attendu.

#### Chargement du topic et de l'utilisateur en parallèle
```typescript
const [topicData, meData] = await Promise.all([
  fetch(`/api/forum/topics/${id}/`, ...).then(r => r.json()),
  fetch('/api/accounts/me/', ...).then(r => r.json()),
]
setTopic(topicData)
setCurrentUser(meData)
```
On a besoin de l'utilisateur courant pour : (1) afficher les boutons agents uniquement aux agents, (2) savoir si l'utilisateur a déjà voté.

#### Composant Avatar généré dynamiquement
```typescript
function Avatar({ user }: { user: Author }) {
  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
  const isAgent = user.user_type === 'agent'
  const bg = isAgent ? '#198754' : '#0d6efd'
  return (
    <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg }}>
      {initials}
    </div>
  )
}
```
Génère un cercle coloré avec les initiales de l'utilisateur. Vert pour les agents, bleu pour les citoyens — distinction visuelle immédiate.

#### Contrôles agents conditionnels
```typescript
{currentUser?.user_type === 'agent' && (
  <>
    <button onClick={handlePinTopic}>
      {topic.is_pinned ? 'Désépingler' : 'Épingler'}
    </button>
    <button onClick={handleResolveTopic}>
      {topic.is_resolved ? 'Marquer non résolu' : 'Marquer résolu'}
    </button>
  </>
)}
```
`currentUser?.user_type === 'agent'` : le `?` est l'opérateur optional chaining — si `currentUser` est `null`, l'expression retourne `undefined` (pas d'erreur). Ces boutons sont **invisibles pour les citoyens**.

#### Soumission d'une réponse
```typescript
const handleReplySubmit = async () => {
  if (!replyContent.trim()) return
  const res = await fetch(`/api/forum/topics/${id}/reply/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}` },
    body: JSON.stringify({ content: replyContent }),
  })
  const newReply = await res.json()
  setTopic(prev => prev ? {
    ...prev,
    replies: [...prev.replies, newReply],
    replies_count: prev.replies_count + 1
  } : prev)
  setReplyContent('')
}
```
Après la soumission : on ajoute la nouvelle réponse directement dans le state local sans recharger toute la page (**mise à jour optimiste**). `[...prev.replies, newReply]` : crée un nouveau tableau avec toutes les replies existantes + la nouvelle.

---

## 🔗 Intégration dans l'application

### `App.tsx`
```typescript
import ForumPage from './pages/ForumPage'
import ForumTopicPage from './pages/ForumTopicPage'

<Route path="/forum" element={<ForumPage />} />
<Route path="/forum/:id" element={<ForumTopicPage />} />
```
 est un **paramètre dynamique** — , , etc. sont toutes gérées par .

### 
```typescript
const [forumUnread, setForumUnread] = useState(0)
// ...
const unread = nData.filter((n) => !n.is_read).length
setForumUnread(unread)
// ...
{forumUnread > 0 && (
  <span className="badge bg-danger rounded-pill ms-2">{forumUnread}</span>
)}
```
`forumUnread > 0 && (...)` : le badge rouge n'apparaît que s'il y a au moins une notification non lue (rendu conditionnel).

### 
Ajout de 35 nouvelles clés bilingues (FR + AR) comme `forum`, `forum_desc`, `new_topic`, `pinned`, `resolved`, `no_topics`, etc. La fonction `t('forum')` retourne automatiquement la traduction dans la langue courante.

---

## 🔄 Flux complet d'une interaction type

**Scénario : un citoyen crée un topic, un agent répond**

1. Citoyen ouvre `/forum` → React fetch `GET /api/forum/topics/` → Django retourne la liste JSON → `useState` met à jour → React re-render affiche les cards
2. Citoyen clique "Nouveau Sujet" → modal s'ouvre → remplit titre/contenu/tags → clique Envoyer → `POST /api/forum/topics/` avec `{ title, content, category, tag_names: ["eau"] }` → Django `TopicCreateSerializer.create()` crée le Topic + les Tags + les associations M2M → retourne le nouveau topic → React l'ajoute à la liste
3. Agent ouvre le topic → `GET /api/forum/topics/1/` → Django `retrieve()` incrémente `views` puis retourne le topic avec ses replies
4. Agent répond → `POST /api/forum/topics/1/reply/` → Django crée la `Reply` → le **signal** `post_save` se déclenche automatiquement → `Notification.objects.create(recipient=topic.author, ...)` → citoyen verra le badge rouge
5. Citoyen revient sur le dashboard → `GET /api/forum/notifications/` retourne ses notifications → badge rouge s'affiche
6. Agent épingle → `POST /api/forum/topics/1/pin/` → Django vérifie `IsAgentOrAdmin` → toggle `is_pinned` → topic remonte en tête de liste grâce à `ordering = ['-is_pinned']`

---

## 📁 Récapitulatif des fichiers créés/modifiés

### Fichiers créés (Backend)
| Fichier | Rôle |
|---|---|
| `forum/models.py` | 5 modèles : Tag, Topic, Reply, Vote, Notification |
| `forum/serializers.py` | 7 sérialiseurs pour transformer les objets en JSON |
| `forum/views.py` | 5 ViewSets avec toutes les actions API |
| `forum/urls.py` | Routes API avec DefaultRouter |
| `forum/permissions.py` | Permission IsAgentOrAdmin |
| `forum/signals.py` | Auto-création des notifications à chaque reply |
| `forum/admin.py` | Enregistrement dans l'interface d'administration |
| `forum/apps.py` | Config de l'app + import des signals |
| `forum/migrations/0001_initial.py` | Migration de base de données |

### Fichiers créés (Frontend)
| Fichier | Rôle |
|---|---|
| `frontend-react/src/pages/ForumPage.tsx` | Page liste des topics avec filtres, stats, modal création |
| `frontend-react/src/pages/ForumTopicPage.tsx` | Page détail topic avec replies, votes, contrôles agents |

### Fichiers modifiés
| Fichier | Modification |
|---|---|
| `core/settings.py` | Ajout de `'forum'` dans INSTALLED_APPS |
| `core/urls.py` | Ajout de `path('api/forum/', include('forum.urls'))` |
| `frontend-react/src/App.tsx` | 2 imports + 2 routes `/forum` et `/forum/:id` |
| `frontend-react/src/pages/DashboardPage.tsx` | Carte Forum + badge notifications non lues |
| `frontend-react/src/pages/AgentDashboardPage.tsx` | Carte Forum pour les agents |
| `frontend-react/src/i18n/LanguageProvider.tsx` | 35 nouvelles clés de traduction FR + AR |
