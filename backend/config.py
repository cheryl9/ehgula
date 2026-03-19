from dotenv import load_dotenv
import os
from pathlib import Path

ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# ── Supabase ──────────────────────────────────
SUPABASE_URL              = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY         = os.getenv("SUPABASE_ANON_KEY")

# ── HuggingFace ───────────────────────────────
HF_TOKEN = os.getenv("HF_TOKEN")
