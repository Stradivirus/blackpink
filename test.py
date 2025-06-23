from pymongo import MongoClient
from collections import Counter, defaultdict

client = MongoClient("mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
db = client["blackpink"]
collection = db["incident_logs"]

def get_month_from_doc(doc):
    if 'month' in doc:
        return doc['month']
    elif 'incident_date' in doc:
        try:
            return int(str(doc['incident_date'])[5:7])
        except:
            return None
    else:
        return None

# incident_logs 컬렉션에서 incident_date 기준으로 월별 개수 출력
month_counter = Counter()
for doc in collection.find():
    month = get_month_from_doc(doc)
    if month:
        month_counter[month] += 1

# threat_type별로 카운트
threat_counter = Counter()
# threat_type별 월별 카운트
threat_month_counter = defaultdict(Counter)

for doc in collection.find():
    threat_type = doc.get('threat_type')
    month = get_month_from_doc(doc)
    if threat_type:
        threat_counter[threat_type] += 1
        if month:
            threat_month_counter[threat_type][month] += 1

# 상위 5개 threat_type 추출
top_5_threats = [t for t, _ in threat_counter.most_common(5)]

print("월별 incident_logs 개수:")
for month, count in sorted(month_counter.items()):
    print(f"{month}월: {count}건")

print("\n상위 5개 threat_type별 월별 incident_logs 개수:")
for threat in top_5_threats:
    print(f"\n[ {threat} ]")
    for month in sorted(threat_month_counter[threat]):
        print(f"  {month}월: {threat_month_counter[threat][month]}건")