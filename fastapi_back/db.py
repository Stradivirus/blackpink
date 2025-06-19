from pymongo import MongoClient

# 직접 입력
uri = "mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)

db = client["blackpink"]
board_collection = db["board"]
member_collection = db["member"]
comment_collection = db["comment"]
admin_collection = db["admins"]
incident_collection = db["incident_logs"]