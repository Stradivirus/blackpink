import random
import string
from datetime import datetime  # 수정: date → datetime
from db import member_collection
import smtplib
from email.mime.text import MIMEText
from passlib.hash import bcrypt

def generate_temp_password(length=10):
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for _ in range(length))

def send_email(to_email: str, user_id: str, temp_password: str):
    smtp_server = "smtp.naver.com"
    smtp_port = 587
    smtp_user = "stradivirus@naver.com"  # 실제 이메일로 변경
    smtp_password = "R6LZJP61QE4R"  # 앱 비밀번호 등으로 변경

    subject = "임시 비밀번호 안내"
    body = f"안녕하세요.\n\n아이디: {user_id}\n임시 비밀번호: {temp_password}\n로그인 후 비밀번호를 꼭 변경해주세요."
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = to_email

    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, to_email, msg.as_string())

def create_member(userId: str, nickname: str, email: str):
    temp_password = generate_temp_password()
    hashed_password = bcrypt.hash(temp_password)  # 비밀번호 해시
    member = {
        "userId": userId,
        "nickname": nickname,
        "password": hashed_password,  # 해시된 비밀번호 저장
        "email": email,
        "joinedAt": datetime.now()  # 수정: date.today() → datetime.now()
    }
    if member_collection.find_one({"userId": userId}):
        raise ValueError("이미 존재하는 아이디입니다.")
    member_collection.insert_one(member)
    send_email(email, userId, temp_password)
    return member