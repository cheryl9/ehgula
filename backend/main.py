from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import agent, chat, meals

app = FastAPI(title="ChronicCompanion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ──────────────────────────
app.include_router(agent.router)
app.include_router(chat.router)
app.include_router(meals.router)


# ── Health check ──────────────────────────────
@app.get("/")
def root():
    return {"status": "ChronicCompanion backend running"}
