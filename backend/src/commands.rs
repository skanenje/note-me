use crate::state::AppState;
use std::sync::Arc;
use axum::body::Body;
use axum::http::Request;
use axum::middleware::Next;
use axum::response::Response;

pub async fn log_requests(req: Request<Body>, next: Next) -> Response {
    let method = req.method().clone();
    let uri = req.uri().clone();
    println!("[BACKEND] --> {} {}", method, uri);
    let response = next.run(req).await;
    println!("[BACKEND] <-- {} {} {}", method, uri, response.status());
    response
}

pub async fn get_all_tools(state: Arc<AppState>) -> Result<Vec<serde_json::Value>, String> {
    println!("[BACKEND] get_all_tools called");
    let db = state.db.lock().unwrap();
    let tools = db.get_all_tools().map_err(|e| e.to_string())?;
    println!("[BACKEND] get_all_tools returning {} tools", tools.len());
    Ok(tools.into_iter().map(|t| serde_json::to_value(t).unwrap()).collect())
}

pub async fn get_all_sessions(state: Arc<AppState>) -> Result<Vec<serde_json::Value>, String> {
    println!("[BACKEND] get_all_sessions called");
    let db = state.db.lock().unwrap();
    let sessions = db.get_all_sessions().map_err(|e| e.to_string())?;
    println!("[BACKEND] get_all_sessions returning {} sessions", sessions.len());
    Ok(sessions.into_iter().map(|s| serde_json::to_value(s).unwrap()).collect())
}

pub async fn create_session(state: Arc<AppState>, tool_id: String) -> Result<serde_json::Value, String> {
    println!("[BACKEND] create_session called for tool_id: {}", tool_id);
    let db = state.db.lock().unwrap();
    let session = db.create_session(tool_id).map_err(|e| e.to_string())?;
    println!("[BACKEND] create_session created session: {}", session.id);
    Ok(serde_json::to_value(session).unwrap())
}

pub async fn update_session_activity(state: Arc<AppState>, session_id: String) -> Result<(), String> {
    println!("[BACKEND] update_session_activity called for: {}", session_id);
    let db = state.db.lock().unwrap();
    db.update_session_activity(session_id).map_err(|e| e.to_string())
}
