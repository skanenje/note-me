mod db;
mod commands;
mod state;

use axum::{
    extract::State,
    http::Method,
    middleware,
    routing::{get, post, put},
    Json, Router,
};
use tower_http::cors::{Any, CorsLayer};
use std::sync::Arc;

use db::Database;
use commands::*;

type AppState = Arc<state::AppState>;

#[tokio::main]
async fn main() {
    println!("[BACKEND] Starting wax-space-server...");

    // Initialize database
    let db_path = std::env::current_dir()
        .unwrap()
        .join("wax-space.db");

    println!("[BACKEND] Database path: {:?}", db_path);

    let db = Database::new(db_path).expect("Failed to create database");
    db.init_schema().expect("Failed to initialize schema");
    println!("[BACKEND] Database initialized");

    let app_state = Arc::new(state::AppState {
        db: std::sync::Mutex::new(db),
    });

    // Setup CORS
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::OPTIONS])
        .allow_origin(Any)
        .allow_headers(Any);

    // Setup routes with request logging middleware
    let app = Router::new()
        .route("/api/tools", get(get_all_tools_handler))
        .route("/api/sessions", get(get_all_sessions_handler))
        .route("/api/sessions", post(create_session_handler))
        .route("/api/sessions/:id/activity", put(update_session_activity_handler))
        .layer(middleware::from_fn(log_requests))
        .layer(cors)
        .with_state(app_state);

    println!("[BACKEND] Routes registered. Server running on http://127.0.0.1:3001");

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3001")
        .await
        .unwrap();

    axum::serve(listener, app).await.unwrap();
}

async fn get_all_tools_handler(State(state): State<AppState>) -> Json<serde_json::Value> {
    match get_all_tools(state).await {
        Ok(tools) => Json(serde_json::json!(tools)),
        Err(e) => {
            eprintln!("[BACKEND] ERROR in get_all_tools: {}", e);
            Json(serde_json::json!({"error": e}))
        }
    }
}

async fn get_all_sessions_handler(State(state): State<AppState>) -> Json<serde_json::Value> {
    match get_all_sessions(state).await {
        Ok(sessions) => Json(serde_json::json!(sessions)),
        Err(e) => {
            eprintln!("[BACKEND] ERROR in get_all_sessions: {}", e);
            Json(serde_json::json!({"error": e}))
        }
    }
}

async fn create_session_handler(
    State(state): State<AppState>,
    Json(payload): Json<serde_json::Value>,
) -> Json<serde_json::Value> {
    let tool_id = payload["tool_id"].as_str().unwrap_or("");
    match create_session(state, tool_id.to_string()).await {
        Ok(session) => Json(serde_json::json!(session)),
        Err(e) => {
            eprintln!("[BACKEND] ERROR in create_session: {}", e);
            Json(serde_json::json!({"error": e}))
        }
    }
}

async fn update_session_activity_handler(
    State(state): State<AppState>,
    axum::extract::Path(id): axum::extract::Path<String>,
) -> Json<serde_json::Value> {
    match update_session_activity(state, id).await {
        Ok(_) => Json(serde_json::json!({"success": true})),
        Err(e) => {
            eprintln!("[BACKEND] ERROR in update_session_activity: {}", e);
            Json(serde_json::json!({"error": e}))
        }
    }
}
