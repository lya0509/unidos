import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Missing SUPABASE_URL or SUPABASE_KEY")
    exit(1)

supabase: Client = create_client(url, key)

print("Wait, Supabase REST API does not allow arbitrary SQL execution easily without postgres connection or rpc.")
print("I should just use supabase-py to do it, but wait, if there's no RPC, I can't do it.")
