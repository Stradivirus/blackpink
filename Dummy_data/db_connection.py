from pymongo import MongoClient
import certifi

# MongoDB 연결 설정
URI = "mongodb+srv://stradivirus:1q2w3e4r6218@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

def get_db_connection():
    """MongoDB 연결을 반환하는 함수"""
    client = MongoClient(URI, tlsCAFile=certifi.where())
    return client["blackpink"]

def get_collections():
    """자주 사용하는 컬렉션들을 반환하는 함수"""
    db = get_db_connection()
    return {
        "companies": db["companies"],
        "admins": db["admins"],
        "incident_logs": db["incident_logs"],
        "sys_dev": db["sys_dev"]
    }
