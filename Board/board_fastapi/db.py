from pymongo import MongoClient

# 직접 입력
uri = "mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)

db = client["blackpink"]  # 데이터베이스 이름을 "blackpink"로 설정
board_collection = db["board"]
member_collection = db["member"]
comment_collection = db["comment"]