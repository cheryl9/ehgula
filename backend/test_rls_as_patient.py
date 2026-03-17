import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
ANON_KEY = os.getenv("SUPABASE_ANON_KEY")  # only for RLS testing

if not SUPABASE_URL:
    raise ValueError("Missing SUPABASE_URL in .env")

if not ANON_KEY:
    raise ValueError("Missing SUPABASE_ANON_KEY in .env")


def print_table(client, table_name: str) -> None:
    try:
        response = client.table(table_name).select("*").execute()
        print(f"{table_name}: {response.data}")
    except Exception as e:
        print(f"{table_name}: ERROR -> {e}")


def run_test(email: str, password: str, label: str) -> None:
    print(f"\n===== Testing as {label} =====")

    client = create_client(SUPABASE_URL, ANON_KEY)

    auth_response = client.auth.sign_in_with_password({
        "email": email,
        "password": password
    })

    if not auth_response.user:
        raise ValueError(f"Login failed for {label}")

    print("Signed in:", auth_response.user.email)

    tables_to_test = [
        "profiles",
        "clinicians",
        "patients",
        "clinician_patient_assignments",
        "glucose_readings",
        "medication_plans",
        "medication_dose_logs",
        "meal_logs",
        "exercise_logs",
        "calendar_events",
        "agent_actions",
        "weekly_health_digests",
    ]

    for table_name in tables_to_test:
        print_table(client, table_name)

    client.auth.sign_out()


if __name__ == "__main__":
    PATIENT_EMAIL = "patient1@test.com"
    PATIENT_PASSWORD = "your_test_password"

    CLINICIAN_EMAIL = "clinician1@test.com"
    CLINICIAN_PASSWORD = "your_test_password"

    run_test(PATIENT_EMAIL, PATIENT_PASSWORD, "patient")
    run_test(CLINICIAN_EMAIL, CLINICIAN_PASSWORD, "clinician")