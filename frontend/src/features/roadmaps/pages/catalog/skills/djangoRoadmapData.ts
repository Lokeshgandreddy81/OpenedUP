export type DjangoRoadmapStatus = "personal" | "alternative" | "optional";

export interface DjangoRoadmapNode {
  id: string;
  title: string;
  status?: DjangoRoadmapStatus;
  roadmapId?: string;
}

export interface DjangoRoadmapGroup {
  id: string;
  parent?: DjangoRoadmapNode;
  items: DjangoRoadmapNode[];
}

export interface DjangoRoadmapStage {
  id: string;
  node: DjangoRoadmapNode;
  left?: DjangoRoadmapGroup[];
  right?: DjangoRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface DjangoRoadmapSection {
  id: string;
  title?: string;
  stages: DjangoRoadmapStage[];
}

export interface DjangoRoadmapLink {
  label: string;
  roadmapId: string;
}

export const DJANGO_MARKERS: Array<{
  status: DjangoRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const DJANGO_RELATED_ROADMAPS: DjangoRoadmapLink[] = [
  { label: "Python Roadmap", roadmapId: "skill-python" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "Full Stack Developer", roadmapId: "full-stack" },
  { label: "PostgreSQL DBA", roadmapId: "postgresql" },
  { label: "Redis Roadmap", roadmapId: "skill-redis" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "API Design Roadmap", roadmapId: "skill-api-design" },
];

export const DJANGO_CONTINUE_LEARNING: DjangoRoadmapLink[] = [
  { label: "Python", roadmapId: "skill-python" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "PostgreSQL", roadmapId: "postgresql" },
  { label: "Docker", roadmapId: "skill-docker" },
  { label: "Software Architect", roadmapId: "software-architect" },
];

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: DjangoRoadmapStatus,
  roadmapId?: string,
  customId?: string
): DjangoRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: DjangoRoadmapNode[],
  parent?: DjangoRoadmapNode,
  customId?: string
): DjangoRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<DjangoRoadmapStage, "id" | "node"> & {
    status?: DjangoRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): DjangoRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. DJANGO BASICS & ARCHITECTURE
const DJANGO_BASICS_AND_ARCHITECTURE: DjangoRoadmapSection = {
  id: "django-basics-and-architecture",
  title: "Django Basics & Architecture",
  stages: [
    stage("Prerequisites & Environment", {
      left: [
        g(
          [
            n("Python Fundamentals & OOP", "personal", "skill-python"),
            n("Virtual Environments (venv / uv / poetry)", "personal"),
            n("pip & requirements.txt / pyproject.toml"),
            n("Relational Database Basics", undefined, "skill-sql"),
          ],
          n("Python & Tooling")
        ),
      ],
      right: [
        g(
          [
            n("HTTP Protocol & Methods (GET, POST, PUT, DELETE)"),
            n("Client-Server Architecture"),
            n("Command Line & Terminal Basics", undefined, "skill-shell"),
          ],
          n("Web Fundamentals")
        ),
      ],
      noteAfter:
        "Django follows the 'Batteries-Included' philosophy, providing built-in tools for auth, ORM, admin, routing, and security out of the box.",
    }),
    stage("MVT Pattern & Project Architecture", {
      status: "personal",
      left: [
        g(
          [
            n("Model-View-Template (MVT) vs MVC", "personal"),
            n("django-admin startproject & manage.py", "personal"),
            n("Modular Apps (python manage.py startapp)", "personal"),
            n("INSTALLED_APPS Configuration"),
          ],
          n("Django Architectural Paradigm")
        ),
      ],
      right: [
        g(
          [
            n("settings.py Organization", "personal"),
            n("django-environ / python-decouple for Secrets", "personal"),
            n("Splitting Settings (base, local, production)"),
            n("Django System Check Framework"),
          ],
          n("Configuration & Environments")
        ),
      ],
      projectIdea:
        "Milestone: Bootstrap a Multi-App Django Project with Environment-Based Settings",
    }),
    stage("URL Routing & Request Lifecycle", {
      status: "personal",
      left: [
        g(
          [
            n("urls.py & path() function", "personal"),
            n("Path Converters (str, int, slug, uuid)", "personal"),
            n("re_path() for Regex Patterns"),
            n("URL Namespacing & app_name with reverse()", "personal"),
          ],
          n("URL Dispatcher")
        ),
      ],
      right: [
        g(
          [
            n("HttpRequest & HttpResponse Objects", "personal"),
            n("WSGI (wsgi.py) & ASGI (asgi.py) Handlers"),
            n("Middleware Pipeline Architecture", "personal"),
            n("Custom Middleware Creation (__call__, process_view)"),
          ],
          n("Request / Response Lifecycle")
        ),
      ],
    }),
  ],
};

// 2. MODELS & DJANGO ORM
const MODELS_AND_DJANGO_ORM: DjangoRoadmapSection = {
  id: "models-and-django-orm",
  title: "Models & Django ORM",
  stages: [
    stage("Model Fields & Schema Definition", {
      status: "personal",
      left: [
        g(
          [
            n("CharField, TextField & SlugField", "personal"),
            n("IntegerField, DecimalField & FloatField"),
            n("DateTimeField & auto_now / auto_now_add"),
            n("BooleanField, EmailField & UUIDField"),
            n("JSONField (PostgreSQL & SQLite)", "personal"),
          ],
          n("Core Model Fields")
        ),
      ],
      right: [
        g(
          [
            n("Field Options (null, blank, default, choices)", "personal"),
            n("Primary Keys & db_index=True", "personal"),
            n("unique=True & UniqueConstraint"),
            n("Model Meta Options (ordering, verbose_name, db_table)"),
            n("__str__ Method & Representation"),
          ],
          n("Field Attributes & Model Meta")
        ),
      ],
    }),
    stage("Database Relationships", {
      status: "personal",
      left: [
        g(
          [
            n("One-to-Many: ForeignKey with related_name", "personal"),
            n("on_delete Behaviors (CASCADE, PROTECT, SET_NULL)", "personal"),
            n("One-to-One: OneToOneField (User Profiles)", "personal"),
            n("Self-Referential Relationships (Tree structures)"),
          ],
          n("Hierarchical Relations")
        ),
      ],
      right: [
        g(
          [
            n("Many-to-Many: ManyToManyField", "personal"),
            n("Intermediary 'through' Table Models", "personal"),
            n("Forward & Reverse Relation Queries"),
            n("Generic Foreign Keys with ContentTypes", "alternative"),
          ],
          n("Many-to-Many & Polymorphic")
        ),
      ],
      projectIdea:
        "Milestone: Design an E-Commerce Relational Data Schema with Custom 'through' Models",
    }),
    stage("Database Migrations", {
      status: "personal",
      left: [
        g(
          [
            n("python manage.py makemigrations", "personal"),
            n("python manage.py migrate", "personal"),
            n("showmigrations & sqlmigrate inspection"),
            n("Reversible Migrations & Rollbacks"),
          ],
          n("Migration Workflow")
        ),
      ],
      right: [
        g(
          [
            n("Data Migrations with RunPython & RunSQL", "personal"),
            n("Squashing Migrations for Clean Histories"),
            n("Handling Non-Nullable Field Additions"),
            n("Zero-Downtime Migration Strategies"),
          ],
          n("Advanced Migrations")
        ),
      ],
    }),
    stage("QuerySets, Managers & Advanced Queries", {
      status: "personal",
      left: [
        g(
          [
            n("Lazy Evaluation of QuerySets", "personal"),
            n("filter(), exclude(), get() & order_by()", "personal"),
            n("Field Lookups (__exact, __icontains, __in, __gt)", "personal"),
            n("values() & values_list(flat=True)"),
            n("Custom models.Manager & QuerySet Methods"),
          ],
          n("QuerySet Basics & Managers")
        ),
      ],
      right: [
        g(
          [
            n("Q Objects for OR / AND / NOT Queries", "personal"),
            n("F Expressions for Atomic Field Updates", "personal"),
            n("annotate() & aggregate() with Count/Sum/Avg", "personal"),
            n("Subquery & Exists OuterRef Expressions"),
            n("Raw SQL & cursor.execute() fallback", "alternative"),
          ],
          n("Advanced ORM Expressions")
        ),
      ],
      noteAfter:
        "Django QuerySets are lazy: they do not execute database queries until evaluated by iteration, slicing, repr, len, list, or boolean checking.",
    }),
  ],
};

// 3. VIEWS & TEMPLATES
const VIEWS_AND_TEMPLATES: DjangoRoadmapSection = {
  id: "views-and-templates",
  title: "Views & Templates",
  stages: [
    stage("Function-Based Views (FBVs) & Class-Based Views (CBVs)", {
      status: "personal",
      left: [
        g(
          [
            n("Function-Based Views (FBVs)", "personal"),
            n("render(), redirect() & get_object_or_404()", "personal"),
            n("View Decorators (@login_required, @require_http_methods)"),
            n("JsonResponse & Handling AJAX Requests"),
          ],
          n("Function-Based Views")
        ),
      ],
      right: [
        g(
          [
            n("Class-Based Views (View, TemplateView)", "personal"),
            n("Generic CBVs: ListView & DetailView", "personal"),
            n("Editing CBVs: CreateView, UpdateView, DeleteView", "personal"),
            n("CBV Mixins (LoginRequiredMixin, UserPassesTestMixin)"),
            n("Overriding get_queryset() & get_context_data()"),
          ],
          n("Class-Based Views")
        ),
      ],
      projectIdea: "Milestone: Refactor an FBV Blog Application to Clean Generic Class-Based Views",
    }),
    stage("Django Template Language (DTL)", {
      left: [
        g(
          [
            n("Template Inheritance ({% extends %}, {% block %})", "personal"),
            n("Including Partials ({% include %})"),
            n("Template Variables & Context Dictionaries"),
            n("Control Flow ({% if %}, {% for %}, {% empty %})"),
          ],
          n("Template Structure & Inheritance")
        ),
      ],
      right: [
        g(
          [
            n("Built-in Filters (date, truncatewords, default)", "personal"),
            n("Custom Template Filters (@register.filter)", "personal"),
            n("Custom Simple & Inclusion Tags (@register.inclusion_tag)"),
            n("Context Processors (Making globals available across views)", "personal"),
          ],
          n("Filters, Tags & Processors")
        ),
      ],
    }),
    stage("Static & Media File Management", {
      left: [
        g(
          [
            n("STATIC_URL & STATICFILES_DIRS", "personal"),
            n("STATIC_ROOT & python manage.py collectstatic", "personal"),
            n("Serving Static in Development vs Production"),
            n("WhiteNoise for Pure Python Static Serving", "personal"),
          ],
          n("Static Assets (CSS, JS, Fonts)")
        ),
      ],
      right: [
        g(
          [
            n("MEDIA_URL & MEDIA_ROOT", "personal"),
            n("FileField & ImageField with Pillow", "personal"),
            n("File Upload Handlers & Custom Storage"),
            n("Cloud Storage with django-storages (AWS S3 / GCS)", "personal"),
          ],
          n("User Uploaded Media Files")
        ),
      ],
    }),
    stage("Forms, ModelForms & Validation", {
      status: "personal",
      left: [
        g(
          [
            n("Django Forms (forms.Form)", "personal"),
            n("ModelForms (forms.ModelForm)", "personal"),
            n("HTML Widget Customization & CSS Classes", "personal"),
            n("Form Rendering ({% csrf_token %}, {{ form.as_p }})"),
          ],
          n("Form Definitions")
        ),
      ],
      right: [
        g(
          [
            n("Form Validation: is_valid() & cleaned_data", "personal"),
            n("Custom Field Validation (clean_<fieldname>)", "personal"),
            n("Form-Level Validation (clean() method)", "personal"),
            n("Formsets & Inline Formsets for Multi-Row Forms"),
          ],
          n("Validation & Formsets")
        ),
      ],
      noteAfter:
        "Always use Django ModelForms for database-backed inputs. Never trust user input, and always rely on `is_valid()` to trigger clean sanitization methods.",
    }),
  ],
};

// 4. AUTHENTICATION & SECURITY
const AUTHENTICATION_AND_SECURITY: DjangoRoadmapSection = {
  id: "authentication-and-security",
  title: "Authentication & Security",
  stages: [
    stage("Django Authentication System", {
      status: "personal",
      left: [
        g(
          [
            n("django.contrib.auth Module", "personal"),
            n("Default User Model & Limitations"),
            n("Custom User Model (AbstractUser vs AbstractBaseUser)", "personal"),
            n("AUTH_USER_MODEL Setting Configuration", "personal"),
          ],
          n("User Model Architecture")
        ),
      ],
      right: [
        g(
          [
            n("authenticate(), login() & logout()", "personal"),
            n("Password Hashing (PBKDF2, Argon2, BCrypt)", "personal"),
            n("Password Reset & Verification Email Flows"),
            n("Session Backends (Database, Cached, Redis)"),
          ],
          n("Auth Flows & Password Security")
        ),
      ],
      projectIdea:
        "Milestone: Implement a Custom User Model with Email Login & Two-Factor Authentication (django-otp)",
    }),
    stage("Authorization, Permissions & Groups", {
      status: "personal",
      left: [
        g(
          [
            n("Default Permissions (add, change, delete, view)", "personal"),
            n("Custom Permissions via Meta.permissions", "personal"),
            n("User.has_perm() & Groups Management"),
            n("@permission_required & @user_passes_test Decorators"),
          ],
          n("RBAC & Permissions")
        ),
      ],
      right: [
        g(
          [
            n("Django Admin Panel (django.contrib.admin)", "personal"),
            n("ModelAdmin Customization (list_display, search_fields)", "personal"),
            n("Admin Inlines (TabularInline, StackedInline)"),
            n("Custom Admin Actions & Filter Specifiers"),
          ],
          n("Django Admin Management")
        ),
      ],
    }),
    stage("Web Security Protections", {
      status: "personal",
      left: [
        g(
          [
            n("CSRF Defense with CsrfViewMiddleware", "personal"),
            n("XSS Protection via Template Auto-Escaping", "personal"),
            n("SQL Injection Prevention via ORM Parameterization", "personal"),
            n("Clickjacking Mitigation with X-Frame-Options", "personal"),
          ],
          n("Core Vulnerability Defenses")
        ),
      ],
      right: [
        g(
          [
            n("SECRET_KEY Protection & Environment Injection", "personal"),
            n("SECURE_SSL_REDIRECT & Strict-Transport-Security", "personal"),
            n("SESSION_COOKIE_SECURE & CSRF_COOKIE_HTTPONLY", "personal"),
            n("Content Security Policy (CSP) via django-csp"),
            n("python manage.py check --deploy Audit", "personal"),
          ],
          n("Hardening & Production Security")
        ),
      ],
      noteAfter:
        "Django has built-in protections against OWASP Top 10 vulnerabilities, but developers must ensure safe handling when marking strings `safe` or writing raw SQL.",
    }),
  ],
};

// 5. DJANGO REST FRAMEWORK (DRF)
const DJANGO_REST_FRAMEWORK: DjangoRoadmapSection = {
  id: "django-rest-framework",
  title: "Django REST Framework (DRF)",
  stages: [
    stage("Serializers & Validation", {
      status: "personal",
      left: [
        g(
          [
            n("serializers.Serializer vs ModelSerializer", "personal"),
            n("HyperlinkedModelSerializer"),
            n("Nested & Relational Serialization", "personal"),
            n("SerializerMethodField for Computed Fields", "personal"),
          ],
          n("Serializer Architecture")
        ),
      ],
      right: [
        g(
          [
            n("is_valid() & serializer.errors", "personal"),
            n("Field-level Validation (validate_<field>)", "personal"),
            n("Object-level Validation (validate() method)", "personal"),
            n("to_representation() & to_internal_value() overrides"),
          ],
          n("Validation & Serialization Overrides")
        ),
      ],
      projectIdea: "Milestone: Build a Robust REST API with Nested Serializers & Validation in DRF",
    }),
    stage("Views, ViewSets & Routing", {
      status: "personal",
      left: [
        g(
          [
            n("APIView with get(), post(), put(), delete()", "personal"),
            n("Generic API Views (ListCreateAPIView, RetrieveDestroyAPIView)", "personal"),
            n("ModelViewSet & ReadOnlyModelViewSet", "personal"),
            n("Custom Action Decorators (@action)", "personal"),
          ],
          n("DRF View Architecture")
        ),
      ],
      right: [
        g(
          [
            n("DefaultRouter & SimpleRouter", "personal"),
            n("Automatic RESTful Endpoint Generation"),
            n("URL Names & Reversing in DRF"),
            n("Handling Dynamic QuerySets in get_queryset()", "personal"),
          ],
          n("Routers & Endpoints")
        ),
      ],
    }),
    stage("API Authentication & Permissions", {
      status: "personal",
      left: [
        g(
          [
            n("SessionAuthentication & BasicAuthentication"),
            n("TokenAuthentication (django-rest-knox)", "alternative"),
            n("JWT Auth with djangorestframework-simplejwt", "personal"),
            n("Access & Refresh Token Rotation", "personal"),
          ],
          n("API Authentication")
        ),
      ],
      right: [
        g(
          [
            n("IsAuthenticated & IsAdminUser", "personal"),
            n("AllowAny & IsAuthenticatedOrReadOnly"),
            n(
              "Custom Permissions (BasePermission with has_permission / has_object_permission)",
              "personal"
            ),
            n("Object-level Authorization Rules"),
          ],
          n("Permission Classes")
        ),
      ],
    }),
    stage("Filtering, Pagination & Documentation", {
      left: [
        g(
          [
            n("PageNumberPagination & LimitOffsetPagination", "personal"),
            n("django-filter (DjangoFilterBackend)", "personal"),
            n("SearchFilter & OrderingFilter", "personal"),
            n("API Throttling & Rate Limiting (AnonRateThrottle, UserRateThrottle)", "personal"),
          ],
          n("Filtering & Pagination")
        ),
      ],
      right: [
        g(
          [
            n("OpenAPI 3.0 Generation via drf-spectacular", "personal"),
            n("Interactive Swagger UI & ReDoc Documentation", "personal"),
            n("API Versioning (URLPathVersioning, NamespaceVersioning)"),
            n("Custom Exception Handlers"),
          ],
          n("OpenAPI Schemas & Errors")
        ),
      ],
      noteAfter:
        "Always document APIs with OpenAPI schemas (via `drf-spectacular`) so frontend teams and clients can automatically generate typed API clients.",
    }),
  ],
};

// 6. PERFORMANCE, ASYNC & DEPLOYMENT
const PERFORMANCE_ASYNC_AND_DEPLOYMENT: DjangoRoadmapSection = {
  id: "performance-async-and-deployment",
  title: "Performance, Async & Deployment",
  stages: [
    stage("Database Optimization & Query Profiling", {
      status: "personal",
      left: [
        g(
          [
            n("Avoiding N+1 Query Problems", "personal"),
            n("select_related for ForeignKey & OneToOne (SQL JOIN)", "personal"),
            n("prefetch_related for ManyToMany & Reverse FK", "personal"),
            n("only() & defer() to Limit Selected Columns"),
          ],
          n("ORM Query Optimization")
        ),
      ],
      right: [
        g(
          [
            n("django-debug-toolbar for SQL Profiling", "personal"),
            n("Database Indexing (Index, BTree, GinIndex for JSON)", "personal"),
            n("Connection Pooling with PgBouncer"),
            n("Read Replicas & Multi-Database Routing"),
          ],
          n("Profiling & Database Tuning")
        ),
      ],
      projectIdea:
        "Milestone: Profile and Optimize an Application with django-debug-toolbar reducing queries by 90%",
    }),
    stage("Caching Strategies", {
      status: "personal",
      left: [
        g(
          [
            n("Redis Cache Backend (django-redis)", "personal", "skill-redis"),
            n("Memcached Cache Backend", "alternative"),
            n("Per-View Caching (@cache_page)", "personal"),
            n("Template Fragment Caching ({% cache %})"),
          ],
          n("Cache Backends & Scopes")
        ),
      ],
      right: [
        g(
          [
            n("Low-Level Cache API (cache.get, cache.set)", "personal"),
            n("Cache Invalidation Strategies & Signals"),
            n("HTTP Caching Headers (Cache-Control, ETag, Last-Modified)"),
            n("Session Storage in Redis Cache"),
          ],
          n("Granular Caching")
        ),
      ],
    }),
    stage("Background Tasks & Message Queues", {
      status: "personal",
      left: [
        g(
          [
            n("Celery Distributed Task Queue", "personal"),
            n("Redis / RabbitMQ as Message Broker", "personal", "skill-redis"),
            n("@shared_task Decorator & Asynchronous Execution", "personal"),
            n("Task Retries with Exponential Backoff"),
          ],
          n("Celery Workers")
        ),
      ],
      right: [
        g(
          [
            n("Celery Beat for Periodic Scheduled Cron Tasks", "personal"),
            n("Django-Q2 (Lightweight Python-native alternative)", "alternative"),
            n("Flower Dashboard for Task Monitoring"),
            n("Long-running Reports, Emails & Image Processing", "personal"),
          ],
          n("Scheduled Tasks & Monitoring")
        ),
      ],
    }),
    stage("Async Django & Real-Time WebSockets", {
      left: [
        g(
          [
            n("ASGI Architecture & asgiref", "personal"),
            n("Async Views (async def view(request))", "personal"),
            n("sync_to_async & async_to_sync Adapters"),
            n("Async ORM Queries (aall, aget, afilter)"),
          ],
          n("Asynchronous Django")
        ),
      ],
      right: [
        g(
          [
            n("Django Channels for WebSockets", "personal"),
            n("Channel Layers with Redis (channels_redis)", "personal"),
            n("WebsocketConsumer & AsyncWebsocketConsumer", "personal"),
            n("Real-Time Chat, Notifications & Live Updates"),
          ],
          n("Channels & Real-Time")
        ),
      ],
    }),
    stage("Production Deployment & Containerization", {
      status: "personal",
      left: [
        g(
          [
            n("Docker & Multi-Stage Dockerfiles", "personal", "skill-docker"),
            n("Docker Compose (Django, Postgres, Redis, Celery)", "personal"),
            n("Gunicorn (WSGI Server)", "personal"),
            n("Uvicorn / Daphne (ASGI Server)", "personal"),
          ],
          n("Containerization & App Servers")
        ),
      ],
      right: [
        g(
          [
            n("Nginx Reverse Proxy & SSL Termination", "personal"),
            n("PostgreSQL Configuration & PgBouncer", undefined, "postgresql"),
            n("Error Tracking with Sentry", "personal"),
            n("CI/CD Deployments (GitHub Actions, Railway, AWS ECS)", "personal"),
          ],
          n("Reverse Proxy & Operations")
        ),
      ],
      noteAfter:
        "Never run `python manage.py runserver` in production. Always deploy using a production WSGI/ASGI server like Gunicorn or Uvicorn behind an Nginx reverse proxy.",
    }),
  ],
};

export const DJANGO_SECTIONS: DjangoRoadmapSection[] = [
  DJANGO_BASICS_AND_ARCHITECTURE,
  MODELS_AND_DJANGO_ORM,
  VIEWS_AND_TEMPLATES,
  AUTHENTICATION_AND_SECURITY,
  DJANGO_REST_FRAMEWORK,
  PERFORMANCE_ASYNC_AND_DEPLOYMENT,
];
