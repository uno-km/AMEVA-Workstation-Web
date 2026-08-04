import sys

def main():
    print("====================================")
    print("파이썬 샌드박스 테스트 성공!")
    print(f"현재 실행 중인 Python 버전: {sys.version.split()[0]}")
    print("계산 테스트: 2 ** 10 =", 2 ** 10)
    print("====================================")

if __name__ == "__main__":
    main()
