"""
API性能测试 - 验证优化效果
"""
import sys
import time
import requests
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"

# 要测试的关键接口
ENDPOINTS = [
    ("GET", "/api/health", "健康检查"),
    ("GET", "/api/datasources", "数据源列表"),
    ("GET", "/api/metadata/tables", "表列表"),
    ("GET", "/api/graph/stats", "图谱统计"),
    ("GET", "/api/equipment", "设备列表"),
    ("GET", "/api/equipment/risks", "设备风险"),
]


def test_endpoint(method, path, name, iterations=3):
    """测试单个接口（多次取平均）"""
    url = f"{BASE_URL}{path}"
    times = []
    
    for i in range(iterations):
        try:
            start = time.time()
            if method == "GET":
                resp = requests.get(url, timeout=30)
            else:
                resp = requests.post(url, timeout=30)
            elapsed = (time.time() - start) * 1000
            
            if resp.status_code == 200:
                times.append(elapsed)
            else:
                return {"name": name, "status": f"HTTP {resp.status_code}", "avg_ms": 0, "min_ms": 0, "max_ms": 0}
        except Exception as e:
            return {"name": name, "status": "错误", "avg_ms": 0, "min_ms": 0, "max_ms": 0}
    
    return {
        "name": name,
        "status": "OK",
        "avg_ms": sum(times) / len(times),
        "min_ms": min(times),
        "max_ms": max(times)
    }


def main():
    print("=" * 60)
    print("API性能测试")
    print("=" * 60)
    
    # 检查服务
    try:
        resp = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if resp.status_code != 200:
            print("服务不可用")
            return
    except:
        print("无法连接到后端服务")
        return
    
    print(f"目标: {BASE_URL}")
    print(f"测试次数: 每个接口3次取平均")
    print("-" * 60)
    print(f"{'接口名称':<15} {'状态':<8} {'平均(ms)':<10} {'最小(ms)':<10} {'最大(ms)':<10}")
    print("-" * 60)
    
    for method, path, name in ENDPOINTS:
        result = test_endpoint(method, path, name)
        print(f"{result['name']:<15} {result['status']:<8} {result['avg_ms']:<10.0f} {result['min_ms']:<10.0f} {result['max_ms']:<10.0f}")
    
    print("-" * 60)
    print("测试完成")


if __name__ == '__main__':
    main()
