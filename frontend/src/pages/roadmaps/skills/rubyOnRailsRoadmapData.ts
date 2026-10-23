export type RubyOnRailsRoadmapStatus = "personal" | "alternative" | "optional";

export interface RubyOnRailsRoadmapNode {
  id: string;
  title: string;
  status?: RubyOnRailsRoadmapStatus;
  roadmapId?: string;
}

export interface RubyOnRailsRoadmapGroup {
  id: string;
  parent?: RubyOnRailsRoadmapNode;
  items: RubyOnRailsRoadmapNode[];
}

export interface RubyOnRailsRoadmapStage {
  id: string;
  node: RubyOnRailsRoadmapNode;
  left?: RubyOnRailsRoadmapGroup[];
  right?: RubyOnRailsRoadmapGroup[];
  noteAfter?: string;
  projectIdea?: string;
}

export interface RubyOnRailsRoadmapSection {
  id: string;
  title?: string;
  stages: RubyOnRailsRoadmapStage[];
}

export interface RubyOnRailsRoadmapLink {
  label: string;
  roadmapId: string;
}

export const RUBY_ON_RAILS_MARKERS: Array<{
  status: RubyOnRailsRoadmapStatus;
  label: string;
}> = [
  { status: "personal", label: "Personal Recommendation" },
  { status: "alternative", label: "Alternative Option" },
  { status: "optional", label: "Order not strict on roadmap" },
];

export const RUBY_ON_RAILS_RELATED_ROADMAPS: RubyOnRailsLinkMap[] = [
  { label: "Ruby Roadmap", roadmapId: "skill-ruby" },
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "Full Stack Developer", roadmapId: "full-stack" },
  { label: "PostgreSQL DBA", roadmapId: "postgresql" },
  { label: "Redis Roadmap", roadmapId: "skill-redis" },
  { label: "Docker Roadmap", roadmapId: "skill-docker" },
  { label: "API Design", roadmapId: "skill-api-design" },
];

export const RUBY_ON_RAILS_CONTINUE_LEARNING: RubyOnRailsLinkMap[] = [
  { label: "Backend Developer", roadmapId: "backend" },
  { label: "System Design", roadmapId: "skill-system-design" },
  { label: "DevOps Engineer", roadmapId: "devops" },
  { label: "Software Architect", roadmapId: "software-architect" },
];

type RubyOnRailsLinkMap = RubyOnRailsRoadmapLink;

const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const n = (
  title: string,
  status?: RubyOnRailsRoadmapStatus,
  roadmapId?: string,
  customId?: string
): RubyOnRailsRoadmapNode => ({
  id: customId ?? slug(title),
  title,
  status,
  roadmapId,
});

const g = (
  items: RubyOnRailsRoadmapNode[],
  parent?: RubyOnRailsRoadmapNode,
  customId?: string
): RubyOnRailsRoadmapGroup => ({
  id: customId ?? slug(parent?.title ?? items[0]?.title ?? "group"),
  parent,
  items,
});

const stage = (
  title: string,
  options: Omit<RubyOnRailsRoadmapStage, "id" | "node"> & {
    status?: RubyOnRailsRoadmapStatus;
    customId?: string;
    roadmapId?: string;
  } = {}
): RubyOnRailsRoadmapStage => {
  const { status, customId, roadmapId, ...rest } = options;

  return {
    id: customId ?? slug(title),
    node: n(title, status, roadmapId, customId),
    ...rest,
  };
};

// 1. RAILS PHILOSOPHY & MVC
const RAILS_PHILOSOPHY_AND_MVC: RubyOnRailsRoadmapSection = {
  id: "rails-philosophy-and-mvc",
  title: "Rails Philosophy & MVC",
  stages: [
    stage("Philosophy & Principles", {
      left: [
        g(
          [
            n("Convention over Configuration (CoC)", "personal"),
            n("Don't Repeat Yourself (DRY)", "personal"),
            n("The Majestic Monolith"),
            n("Omakase Software Stack"),
          ],
          n("The Rails Doctrine")
        ),
      ],
      right: [
        g(
          [
            n("Ruby Language Proficiency", undefined, "skill-ruby"),
            n("HTTP & REST Fundamentals", undefined, "skill-api-design"),
            n("Relational DB Basics (SQL)", undefined, "skill-sql"),
          ],
          n("Prerequisites")
        ),
      ],
      noteAfter:
        "Ruby on Rails is an opinionated, full-stack web application framework created by David Heinemeier Hansson (DHH) in 2004 to maximize developer productivity and happiness.",
    }),
    stage("MVC Architecture", {
      left: [
        g(
          [
            n("Model (Data & Business Logic)"),
            n("View (HTML & JSON Templates)"),
            n("Controller (Request Orchestrator)"),
          ],
          n("Three-Tier Pattern")
        ),
      ],
      right: [
        g(
          [
            n("Browser Request -> Rack Handler"),
            n("Router maps path to Controller action"),
            n("Controller queries Model"),
            n("Model interacts with Database"),
            n("View renders response payload"),
          ],
          n("Request Lifecycle")
        ),
      ],
    }),
    stage("Application Setup & Generators", {
      left: [
        g(
          [
            n("rails new my_app -d postgresql", "personal"),
            n("rails server (bin/rails s)"),
            n("rails console (bin/rails c)"),
            n("rails runner"),
          ],
          n("Rails CLI")
        ),
      ],
      right: [
        g(
          [
            n("rails generate model"),
            n("rails generate controller"),
            n("rails generate migration"),
            n("rails generate scaffold"),
          ],
          n("Code Generators")
        ),
      ],
      projectIdea:
        "Project: Generate your first full CRUD Rails application using bin/rails scaffold and explore the generated directories",
    }),
  ],
};

// 2. ROUTING & CONTROLLERS
const ROUTING_AND_CONTROLLERS: RubyOnRailsRoadmapSection = {
  id: "routing-and-controllers",
  title: "Routing & Controllers",
  stages: [
    stage("Routing Engine", {
      left: [
        g(
          [
            n("resources :posts (7 RESTful routes)", "personal"),
            n("index, show, new, create, edit, update, destroy"),
            n("Custom member & collection routes"),
            n("Nested Resources (e.g. posts/1/comments)"),
          ],
          n("RESTful Resources")
        ),
      ],
      right: [
        g(
          [
            n("root to: 'home#index'"),
            n("Namespaces (namespace :admin)"),
            n("Route Scopes & Constraints"),
            n("Path & URL Helpers (_path vs _url)"),
          ],
          n("Advanced Routing")
        ),
      ],
      noteAfter:
        "Rails maps incoming HTTP verbs and URIs to controller actions following standard REST conventions, automatically providing helper methods like users_path and user_path(@user).",
    }),
    stage("ActionController", {
      left: [
        g(
          [
            n("params hash"),
            n("render vs redirect_to"),
            n("Flash messages (notice & alert)"),
            n("head, send_data, send_file"),
          ],
          n("Request Handling & Response")
        ),
      ],
      right: [
        g(
          [
            n("before_action, around_action, after_action", "personal"),
            n("Strong Parameters (require & permit)", "personal"),
            n("Session & Cookie Storage"),
            n("CSRF Protection (protect_from_forgery)"),
          ],
          n("Filters & Security")
        ),
      ],
      projectIdea:
        "Project: Build a multi-resource REST API with nested comments, authentication filters, and strong parameter sanitization",
    }),
  ],
};

// 3. ACTIVEMODEL & ACTIVERECORD
const ACTIVEMODEL_AND_ACTIVERECORD: RubyOnRailsRoadmapSection = {
  id: "activemodel-and-activerecord",
  title: "ActiveRecord ORM",
  stages: [
    stage("ActiveRecord Models & Migrations", {
      left: [
        g(
          [
            n("ActiveRecord::Base inheritance"),
            n("Table-to-Class convention (users -> User)"),
            n("CRUD: create, all, find, find_by, update, destroy"),
            n("Attribute accessors & dirty tracking"),
          ],
          n("ActiveRecord Basics")
        ),
      ],
      right: [
        g(
          [
            n("rails db:migrate & rails db:rollback", "personal"),
            n("Schema.rb & db/migrate files"),
            n("Adding columns, indexes & foreign keys"),
            n("Database seeds (db/seeds.rb)"),
          ],
          n("Database Migrations")
        ),
      ],
    }),
    stage("Associations & Queries", {
      left: [
        g(
          [
            n("belongs_to & has_one"),
            n("has_many & has_many :through", "personal"),
            n("has_and_belongs_to_many (HABTM)"),
            n("Polymorphic Associations"),
            n("dependent: :destroy / :nullify"),
          ],
          n("Associations")
        ),
      ],
      right: [
        g(
          [
            n("where, not, or conditions"),
            n("order, limit, offset, pluck, pick"),
            n("Named Scopes (scope :published, -> {})", "personal"),
            n("Eager Loading (includes / preload / eager_load)", "personal"),
            n("Preventing N+1 Queries with Bullet"),
          ],
          n("ActiveRecord Query Interface")
        ),
      ],
    }),
    stage("Validations & Callbacks", {
      left: [
        g(
          [
            n("validates :presence, :uniqueness, :length"),
            n("Custom validation methods (validate :custom)"),
            n("Custom Validator classes (< ActiveModel::Validator)"),
            n("errors.add and error messages"),
          ],
          n("Validations")
        ),
      ],
      right: [
        g(
          [
            n("before_validation, after_validation"),
            n("before_save, around_save, after_save"),
            n("after_commit & after_create_commit", "personal"),
            n("Database Transactions (ActiveRecord::Base.transaction)"),
            n("Optimistic vs Pessimistic Locking"),
          ],
          n("Callbacks & Transactions")
        ),
      ],
      noteAfter:
        "ActiveRecord unites database persistence with domain logic. Always prefer after_commit callbacks when enqueuing background jobs to prevent race conditions before DB transactions commit.",
      projectIdea:
        "Project: Create an eCommerce data layer with products, categories, orders, line items, transaction safety, and inventory validations",
    }),
  ],
};

// 4. VIEWS & MODERN FRONTEND
const VIEWS_AND_MODERN_FRONTEND: RubyOnRailsRoadmapSection = {
  id: "views-and-modern-frontend",
  title: "Views & Modern Frontend",
  stages: [
    stage("ActionView & Templates", {
      left: [
        g(
          [
            n("Embedded Ruby (ERB: <%= %> vs <% %>)"),
            n("Layouts (layouts/application.html.erb)"),
            n("Partials (_item.html.erb with render)", "personal"),
            n("content_for and yield"),
          ],
          n("ERB & Layouts")
        ),
      ],
      right: [
        g(
          [
            n("Form Helpers (form_with model: @model)", "personal"),
            n("Link & Path Helpers (link_to, button_to)"),
            n("Custom Helper Modules (app/helpers)"),
            n("ViewComponent (reusable Ruby UI components)", "alternative"),
          ],
          n("View Helpers & Components")
        ),
      ],
    }),
    stage("Asset Pipeline & Modern JS", {
      left: [
        g(
          [
            n("Propshaft (Modern Rails asset pipeline)", "personal"),
            n("Sprockets (Legacy asset pipeline)"),
            n("Tailwind CSS for Rails", "personal"),
          ],
          n("Asset Management")
        ),
      ],
      right: [
        g(
          [
            n("Importmaps (No Node.js build step)", "personal"),
            n("jsbundling-rails (esbuild / rollup / webpack)"),
            n("cssbundling-rails"),
          ],
          n("JavaScript Bundling")
        ),
      ],
    }),
    stage("Hotwire (Turbo & Stimulus)", {
      left: [
        g(
          [
            n("Turbo Drive (Fast page navigations via fetch)", "personal"),
            n("Turbo Frames (Decompose pages into scoped contexts)", "personal"),
            n("Turbo Streams (Deliver live HTML partial diffs)", "personal"),
            n("turbo_stream_from (WebSocket live streams)"),
          ],
          n("Turbo Suite")
        ),
      ],
      right: [
        g(
          [
            n("Stimulus Controllers (data-controller)", "personal"),
            n("Targets (data-*-target)"),
            n("Actions (data-action='click->...')"),
            n("Values & Classes API"),
          ],
          n("Stimulus JS")
        ),
      ],
      noteAfter:
        "Hotwire (HTML Over The Wire) allows building responsive, reactive SPAs without single-page framework complexity by streaming HTML changes over the wire.",
      projectIdea:
        "Project: Build a real-time collaborative Trello/Kanban board using Turbo Frames, Turbo Streams, and drag-and-drop Stimulus controllers",
    }),
  ],
};

// 5. BACKGROUND JOBS & WEBSOCKETS
const BACKGROUND_JOBS_AND_WEBSOCKETS: RubyOnRailsRoadmapSection = {
  id: "background-jobs-and-websockets",
  title: "Background Jobs & WebSockets",
  stages: [
    stage("Asynchronous Jobs", {
      left: [
        g(
          [
            n("ActiveJob abstraction (< ApplicationJob)", "personal"),
            n("perform_later & perform_now"),
            n("retry_on and discard_on error handling"),
            n("Queue prioritization (queue_as :critical)"),
          ],
          n("ActiveJob")
        ),
      ],
      right: [
        g(
          [
            n("Sidekiq with Redis", "personal", "skill-redis"),
            n("Solid Queue (Rails 8 DB-backed queue)", "alternative"),
            n("GoodJob (Postgres advisory lock queue)"),
            n("Sidekiq-Cron / Recurring Tasks"),
          ],
          n("Queue Adapters")
        ),
      ],
    }),
    stage("Real-Time WebSockets", {
      left: [
        g(
          [
            n("ActionCable Channels & Subscriptions", "personal"),
            n("Connection authentication (ApplicationCable::Connection)"),
            n("ActionCable.server.broadcast"),
            n("Streaming from specific streams"),
          ],
          n("ActionCable")
        ),
      ],
      right: [
        g(
          [
            n("Solid Cable (Database-backed Pub/Sub)", "personal"),
            n("Redis adapter for ActionCable", undefined, "skill-redis"),
            n("AnyCable (High-performance Go/gRPC cable)", "alternative"),
            n("Turbo Streams over ActionCable"),
          ],
          n("Cable Backends & Solid Cable")
        ),
      ],
      noteAfter:
        "With Rails 8, Solid Queue and Solid Cable eliminate mandatory Redis dependencies for small-to-medium deployments by using SQLite or PostgreSQL directly.",
      projectIdea:
        "Project: Implement a live customer chat widget with background email notifications, typing indicators, and WebSocket broadcasts",
    }),
  ],
};

// 6. APIS, ARCHITECTURE & SERVICES
const APIS_AND_ARCHITECTURE: RubyOnRailsRoadmapSection = {
  id: "apis-and-architecture",
  title: "APIs & Application Architecture",
  stages: [
    stage("Rails as an API", {
      left: [
        g(
          [
            n("rails new app --api", "personal"),
            n("ActionController::API slim stack"),
            n("JWT Authentication", "personal"),
            n("Devise / Devise-JWT / Rodauth"),
          ],
          n("API-Only Mode")
        ),
      ],
      right: [
        g(
          [
            n("Jbuilder (JSON templates)"),
            n("Alba / Blueprinter (Fast serializers)", "personal"),
            n("rack-cors configuration"),
            n("OpenAPI / Swagger documentation"),
          ],
          n("Serialization & CORS")
        ),
      ],
    }),
    stage("Domain Architecture & Storage", {
      left: [
        g(
          [
            n("Service Objects (POROs / Interactors)", "personal"),
            n("Form Objects (ActiveModel::Model)"),
            n("Query Objects"),
            n("Policy Objects (Pundit / ActionPolicy)", "personal"),
          ],
          n("Design Patterns")
        ),
      ],
      right: [
        g(
          [
            n("ActionMailer (Transactional emails)"),
            n("ActiveStorage (Direct upload to S3 / R2)"),
            n("Image processing with libvips"),
            n("Solid Cache / MemoryStore / Redis cache"),
          ],
          n("Mailers, Storage & Caching")
        ),
      ],
    }),
  ],
};

// 7. TESTING & DEPLOYMENT
const TESTING_AND_DEPLOYMENT: RubyOnRailsRoadmapSection = {
  id: "testing-and-deployment",
  title: "Testing & Deployment",
  stages: [
    stage("Testing Rails", {
      left: [
        g(
          [
            n("RSpec-Rails (rspec)", "personal"),
            n("Minitest (Rails default)", "alternative"),
            n("FactoryBot & Faker for test factories", "personal"),
            n("DatabaseCleaner / transactional fixtures"),
          ],
          n("Test Frameworks")
        ),
      ],
      right: [
        g(
          [
            n("Capybara with Selenium / Cuprite (System tests)", "personal"),
            n("Request Specs (Testing JSON APIs)"),
            n("WebMock & VCR for external HTTP"),
            n("SimpleCov (Coverage reporting)"),
          ],
          n("Integration & System Testing")
        ),
      ],
    }),
    stage("Deployment & Production", {
      left: [
        g(
          [
            n("Puma Application Server", "personal"),
            n("Falcon (Async HTTP/2 web server)"),
            n("Thruster (HTTP caching reverse proxy)"),
            n("Rails Credentials & ENV Configuration"),
          ],
          n("Production Servers")
        ),
      ],
      right: [
        g(
          [
            n("Kamal (Docker-based zero-downtime deploy)", "personal", "skill-docker"),
            n("Docker & multi-stage Dockerfiles", undefined, "skill-docker"),
            n("Render / Heroku / Fly.io", "alternative"),
            n("PostgreSQL & Connection Pooling (PgBouncer)", undefined, "postgresql"),
          ],
          n("Deployment & Hosting")
        ),
      ],
      noteAfter:
        "Kamal (formerly MRSK) packages Rails applications into standard Docker images and orchestrates rolling zero-downtime deployments to bare-metal servers or cloud VMs effortlessly.",
      projectIdea:
        "Project: Deploy a production-ready SaaS application with automated CI/CD, Kamal deployments, RSpec test suite, and SSL termination",
    }),
  ],
};

export const RUBY_ON_RAILS_SECTIONS: RubyOnRailsRoadmapSection[] = [
  RAILS_PHILOSOPHY_AND_MVC,
  ROUTING_AND_CONTROLLERS,
  ACTIVEMODEL_AND_ACTIVERECORD,
  VIEWS_AND_MODERN_FRONTEND,
  BACKGROUND_JOBS_AND_WEBSOCKETS,
  APIS_AND_ARCHITECTURE,
  TESTING_AND_DEPLOYMENT,
];
