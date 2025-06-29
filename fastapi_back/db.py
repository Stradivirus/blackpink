from pymongo import MongoClient
import certifi
# MongoDB Atlas 연결 URI
# 실제 프로젝트에서는 DB 연결 정보를 환경 변수로 분리해서 관리 필요
uri = "mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri, tlsCAFile=certifi.where())

# 사용할 데이터베이스 지정
db = client["blackpink"]

# 주요 컬렉션
board_collection = db["board"]
member_collection = db["member"]
comment_collection = db["comment"]
admin_collection = db["admins"]
incident_collection = db["incident_logs"]
companies_collection = db["companies"]
dev_collection = db["sys_dev"]
ncsi_collection = db["ncsi"]  # 새 컬렉션
