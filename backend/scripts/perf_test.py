"""
API性能测试脚本 - 测试各个接口的响应时间
"""
import sys
import time
import requests
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"

# 要测试的接口
ENDPOINTS = [
    ("GET", "/api/health", "健康检查"),
    ("GET", "/api/datasources", "数据源列表"),
    ("GET", "/api/metadata/tables", "表列表"),
    ("GET", "/api/metadata/tables/equipment/columns", "表字段"),
    ("GET", "/api/metadata/tables/equipment/sample", "样例数据"),
    ("GET", "/api/ontology/schema", "本体Schema"),
    ("GET", "/api/graph/stats", "图谱统计"),
    ("GET", "/api/graph/nodes", "图谱节点"),
    ("GET", "/api/graph/edges", "图谱边"),
    ("GET", "/api/graph/search?keyword=空压机", "图谱搜索"),
    ("GET", "/api/graph/entity/1/neighbors?depth=2", "节点邻居"),
    ("GET", "/api/equipment", "设备列表"),
    ("GET", "/api/equipment/risks", "设备风险"),
    ("GET", "/api/equipment/risk-summary", "风险摘要"),
    ("GET", "/api/procurement/plans", "采购计划"),
    ("GET", "/api/procurement/contracts", "采购合同"),
    ("GET", "/api/testing/projects", "试验项目"),
    ("GET", "/api/testing/data", "试验数据"),
    ("GET", "/api/maintenance/orders", "维修工单"),
    ("GET", "/api/maintenance/spare-parts", "备件列表"),
]


def test_endpoint(method, path, name):
    """测试单个接口"""
    url = f"{BASE_URL}{path}"
    try:
        start = time.time()
        if method == "GET":
            resp = requests.get(url, timeout=30)
        else:
            resp = requests.post(url, timeout=30)
        elapsed = (time.time() - start) * 1000  # 转换为毫秒
        
        status = "OK" if resp.status_code == 200 else f"HTTP {resp.status_code}"
        return {
            "name": name,
            "path": path,
            "status": status,
            "time_ms": elapsed,
            "size_kb": len(resp.content) / 1024
        }
    except requests.exceptions.ConnectionError:
        return {
            "name": name,
            "path": path,
            "status": "连接失败",
            "time_ms": 0,
            "size_kb": 0
        }
    except requests.exceptions.Timeout:
        return {
            "name": name,
            "path": path,
            "status": "超时",
            "time_ms": 30000,
            "size_kb": 0
        }
    except Exception as e:
        return {
            "name": name,
            "path": path,
            "status": f"错误: {str(e)[:50]}",
            "time_ms": 0,
            "size_kb": 0
        }


def main():
    print("=" * 70)
    print("API性能测试")
    print("=" * 70)
    print(f"目标: {BASE_URL}")
    print("-" * 70)
    
    # 先检查服务是否可用
    try:
        resp = requests.get(f"{BASE_URL}/api/health", timeout=5)
        if resp.status_code != 200:
            print("服务不可用，请先启动后端")
            return
    except:
        print("无法连接到后端服务，请先启动:")
        print("  cd backend && python -m uvicorn app.main:app --reload")
        return
    
    results = []
    for method, path, name in ENDPOINTS:
        result = test_endpoint(method, path, name)
        results.append(result)
        
        # 打印实时结果
        time_str = f"{result['time_ms']:.0f}ms"
        if result['time_ms'] > 1000:
            time_str = f"{result['time_ms']/1000:.1f}s"
        
        size_str = f"{result['size_kb']:.1f}KB"
        
        # 标记慢请求
        slow_mark = ""
        if result['time_ms'] > 1000:
            slow_mark = " [SLOW]"
        elif result['time_ms'] > 5000:
            slow_mark = " [VERY SLOW]"
        
        print(f"[{result['status']:10}] {time_str:>8} {size_str:>10} {result['name']}{slow_mark}")
    
    # 统计
    print("-" * 70)
    total_time = sum(r['time_ms'] for r in results)
    slow_count = len([r for r in results if r['time_ms'] > 1000])
    failed_count = len([r for r in results if r['status'] != 'OK'])
    
    print(f"总耗时: {total_time/1000:.1f}s")
    print(f"慢请求(>1s): {slow_count} 个")
    print(f"失败请求: {failed_count} 个")
    
    # 慢请求详情
    if slow_count > 0:
        print("\n慢请求列表:")
        for r in sorted(results, key=lambda x: x['time_ms'], reverse=True):
            if r['time_ms'] > 1000:
                print(f"  - {r['name']}: {r['time_ms']/1000:.1f}s ({r['path']})")


if __name__ == '__main__':
    main()
