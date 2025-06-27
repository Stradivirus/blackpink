from pymongo import MongoClient

uri = "mongodb+srv://stradivirus:1q2w3e4r@cluster0.e7rvfpz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)
db = client["blackpink"]

incident_collection = db["incident_logs"]

def add_company_names_to_incidents():
    """
    incident_logs 컬렉션의 각 문서에 company_name 필드를 추가하는 함수
    companies 컬렉션의 데이터를 참조하여 company_id로 매칭
    """
    # 회사 데이터 구조 먼저 확인
    companies = list(db["companies"].find({}))
    
    if companies:
        print("회사 데이터 구조 확인:")
        print(companies[0].keys())
        print("첫 번째 회사 데이터:", companies[0])
    else:
        print("회사 데이터가 없습니다.")
        return 0
    
    # company_id 필드가 있는지 확인
    if "company_id" not in companies[0]:
        print("Error: company_id 필드가 없습니다.")
        return 0
    
    company_dict = {c["company_id"]: c["company_name"] for c in companies}
    
    print(f"회사 데이터 {len(companies)}개 로드 완료")
    
    # incident_logs의 모든 문서 가져오기
    incidents = list(incident_collection.find({}))
    
    print(f"사고 데이터 {len(incidents)}개 로드 완료")
    
    updated_count = 0
    not_found_count = 0
    
    for incident in incidents:
        company_id = incident.get("company_id")
        if company_id and company_id in company_dict:
            # company_name 필드 추가
            incident_collection.update_one(
                {"_id": incident["_id"]},
                {"$set": {"company_name": company_dict[company_id]}}
            )
            updated_count += 1
        else:
            print(f"Warning: company_id {company_id} not found in companies collection")
            not_found_count += 1
    
    print(f"총 {updated_count}건의 incident에 company_name 추가 완료")
    if not_found_count > 0:
        print(f"매칭되지 않은 company_id: {not_found_count}건")
    
    return updated_count

def delete_incidents_without_company_name():
    """
    company_name 필드가 없는 incident 데이터들을 삭제하는 함수
    """
    # company_name 필드가 없는 문서 개수 확인
    count_before = incident_collection.count_documents({"company_name": {"$exists": False}})
    print(f"삭제할 문서 수: {count_before}개")
    
    if count_before == 0:
        print("삭제할 문서가 없습니다.")
        return 0
    
    # company_name 필드가 없는 문서들 삭제
    result = incident_collection.delete_many({"company_name": {"$exists": False}})
    
    print(f"총 {result.deleted_count}개의 문서가 삭제되었습니다.")
    
    # 삭제 후 전체 문서 수 확인
    total_after = incident_collection.count_documents({})
    print(f"삭제 후 전체 incident 문서 수: {total_after}개")
    
    return result.deleted_count

# 함수 실행
if __name__ == "__main__":
    delete_incidents_without_company_name()