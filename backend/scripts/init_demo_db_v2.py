"""
设备全生命周期管理演示数据库初始化
覆盖：设备采购、试验鉴定、设备维修保障三大领域
"""
import sqlite3
from pathlib import Path


def init_equipment_db(db_path: Path) -> None:
    """初始化业务数据库"""
    with sqlite3.connect(db_path) as c:
        c.executescript("""
            -- 清理旧表
            DROP TABLE IF EXISTS equipment_support;
            DROP TABLE IF EXISTS equipment_failure_mode;
            DROP TABLE IF EXISTS spare_usage;
            DROP TABLE IF EXISTS support_resource;
            DROP TABLE IF EXISTS spare_part;
            DROP TABLE IF EXISTS failure_mode;
            DROP TABLE IF EXISTS maintenance_order;
            DROP TABLE IF EXISTS maintenance_plan;
            DROP TABLE IF EXISTS appraisal_conclusion;
            DROP TABLE IF EXISTS test_data;
            DROP TABLE IF EXISTS test_plan;
            DROP TABLE IF EXISTS test_project;
            DROP TABLE IF EXISTS acceptance_record;
            DROP TABLE IF EXISTS purchase_contract;
            DROP TABLE IF EXISTS tender_project;
            DROP TABLE IF EXISTS procurement_plan;
            DROP TABLE IF EXISTS equipment;
            DROP TABLE IF EXISTS supplier;
            DROP TABLE IF EXISTS manufacturer;
            DROP TABLE IF EXISTS location;

            -- ==================== 基础表 ====================
            
            -- 部署位置
            CREATE TABLE location (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                parent_id INTEGER,
                description TEXT,
                FOREIGN KEY (parent_id) REFERENCES location(id)
            );

            -- 生产厂家
            CREATE TABLE manufacturer (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                qualification_level TEXT,
                contact TEXT,
                address TEXT,
                established_year INTEGER
            );

            -- 供应商
            CREATE TABLE supplier (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                credit_level TEXT,
                risk_level TEXT,
                contact TEXT,
                address TEXT
            );

            -- 设备主表
            CREATE TABLE equipment (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                model TEXT,
                category TEXT,
                manufacturer_id INTEGER,
                status TEXT DEFAULT '正常',
                location_id INTEGER,
                supplier_id INTEGER,
                importance_level TEXT DEFAULT '一般',
                purchase_date TEXT,
                commission_date TEXT,
                expected_life_years INTEGER,
                serial_no TEXT,
                FOREIGN KEY (manufacturer_id) REFERENCES manufacturer(id),
                FOREIGN KEY (location_id) REFERENCES location(id),
                FOREIGN KEY (supplier_id) REFERENCES supplier(id)
            );

            -- ==================== 采购领域 ====================
            
            -- 采购计划
            CREATE TABLE procurement_plan (
                id INTEGER PRIMARY KEY,
                plan_name TEXT NOT NULL,
                plan_year INTEGER,
                equipment_id INTEGER,
                quantity INTEGER DEFAULT 1,
                budget_amount REAL,
                status TEXT DEFAULT '待审批',
                approved_date TEXT,
                approver TEXT,
                FOREIGN KEY (equipment_id) REFERENCES equipment(id)
            );

            -- 招标项目
            CREATE TABLE tender_project (
                id INTEGER PRIMARY KEY,
                project_name TEXT NOT NULL,
                plan_id INTEGER,
                tender_method TEXT,
                publish_date TEXT,
                bid_deadline TEXT,
                status TEXT DEFAULT '进行中',
                winner_supplier_id INTEGER,
                FOREIGN KEY (plan_id) REFERENCES procurement_plan(id),
                FOREIGN KEY (winner_supplier_id) REFERENCES supplier(id)
            );

            -- 采购合同
            CREATE TABLE purchase_contract (
                id INTEGER PRIMARY KEY,
                contract_no TEXT NOT NULL UNIQUE,
                equipment_id INTEGER,
                supplier_id INTEGER,
                tender_project_id INTEGER,
                amount REAL,
                sign_date TEXT,
                delivery_date TEXT,
                status TEXT DEFAULT '执行中',
                payment_terms TEXT,
                FOREIGN KEY (equipment_id) REFERENCES equipment(id),
                FOREIGN KEY (supplier_id) REFERENCES supplier(id),
                FOREIGN KEY (tender_project_id) REFERENCES tender_project(id)
            );

            -- 验收记录
            CREATE TABLE acceptance_record (
                id INTEGER PRIMARY KEY,
                acceptance_no TEXT NOT NULL,
                contract_id INTEGER,
                equipment_id INTEGER,
                acceptance_date TEXT,
                result TEXT,
                inspector TEXT,
                remarks TEXT,
                FOREIGN KEY (contract_id) REFERENCES purchase_contract(id),
                FOREIGN KEY (equipment_id) REFERENCES equipment(id)
            );

            -- ==================== 试验鉴定领域 ====================
            
            -- 试验项目
            CREATE TABLE test_project (
                id INTEGER PRIMARY KEY,
                project_name TEXT NOT NULL,
                equipment_id INTEGER,
                test_type TEXT,
                start_date TEXT,
                end_date TEXT,
                status TEXT DEFAULT '计划中',
                conclusion TEXT,
                tester TEXT,
                FOREIGN KEY (equipment_id) REFERENCES equipment(id)
            );

            -- 试验方案
            CREATE TABLE test_plan (
                id INTEGER PRIMARY KEY,
                plan_name TEXT NOT NULL,
                project_id INTEGER,
                test_conditions TEXT,
                test_items TEXT,
                acceptance_criteria TEXT,
                created_by TEXT,
                FOREIGN KEY (project_id) REFERENCES test_project(id)
            );

            -- 试验数据
            CREATE TABLE test_data (
                id INTEGER PRIMARY KEY,
                project_id INTEGER,
                test_item TEXT NOT NULL,
                measured_value REAL,
                expected_value REAL,
                unit TEXT,
                pass_flag INTEGER DEFAULT 1,
                test_time TEXT,
                operator TEXT,
                FOREIGN KEY (project_id) REFERENCES test_project(id)
            );

            -- 鉴定结论
            CREATE TABLE appraisal_conclusion (
                id INTEGER PRIMARY KEY,
                conclusion_no TEXT NOT NULL,
                project_id INTEGER,
                appraisal_date TEXT,
                result TEXT,
                experts TEXT,
                remarks TEXT,
                FOREIGN KEY (project_id) REFERENCES test_project(id)
            );

            -- ==================== 维修保障领域 ====================
            
            -- 故障模式
            CREATE TABLE failure_mode (
                id INTEGER PRIMARY KEY,
                mode_name TEXT NOT NULL,
                category TEXT,
                severity_level TEXT,
                detection_method TEXT,
                description TEXT
            );

            -- 设备故障模式关联
            CREATE TABLE equipment_failure_mode (
                id INTEGER PRIMARY KEY,
                equipment_id INTEGER,
                failure_mode_id INTEGER,
                occurrence_probability TEXT,
                FOREIGN KEY (equipment_id) REFERENCES equipment(id),
                FOREIGN KEY (failure_mode_id) REFERENCES failure_mode(id)
            );

            -- 维修计划
            CREATE TABLE maintenance_plan (
                id INTEGER PRIMARY KEY,
                plan_name TEXT NOT NULL,
                equipment_id INTEGER,
                plan_type TEXT,
                planned_date TEXT,
                status TEXT DEFAULT '待执行',
                priority TEXT DEFAULT '普通',
                FOREIGN KEY (equipment_id) REFERENCES equipment(id)
            );

            -- 维修工单
            CREATE TABLE maintenance_order (
                id INTEGER PRIMARY KEY,
                order_no TEXT NOT NULL,
                equipment_id INTEGER,
                plan_id INTEGER,
                failure_mode_id INTEGER,
                fault_desc TEXT,
                repair_action TEXT,
                start_time TEXT,
                end_time TEXT,
                operator TEXT,
                status TEXT DEFAULT '待处理',
                severity TEXT DEFAULT '中',
                cost REAL,
                FOREIGN KEY (equipment_id) REFERENCES equipment(id),
                FOREIGN KEY (plan_id) REFERENCES maintenance_plan(id),
                FOREIGN KEY (failure_mode_id) REFERENCES failure_mode(id)
            );

            -- 备件
            CREATE TABLE spare_part (
                id INTEGER PRIMARY KEY,
                part_name TEXT NOT NULL,
                part_no TEXT,
                category TEXT,
                stock_qty INTEGER DEFAULT 0,
                min_stock INTEGER DEFAULT 5,
                unit_price REAL,
                supplier_id INTEGER,
                FOREIGN KEY (supplier_id) REFERENCES supplier(id)
            );

            -- 备件使用记录
            CREATE TABLE spare_usage (
                id INTEGER PRIMARY KEY,
                order_id INTEGER,
                spare_part_id INTEGER,
                quantity INTEGER DEFAULT 1,
                usage_time TEXT,
                FOREIGN KEY (order_id) REFERENCES maintenance_order(id),
                FOREIGN KEY (spare_part_id) REFERENCES spare_part(id)
            );

            -- 保障资源
            CREATE TABLE support_resource (
                id INTEGER PRIMARY KEY,
                resource_name TEXT NOT NULL,
                resource_type TEXT,
                quantity INTEGER DEFAULT 1,
                status TEXT DEFAULT '可用',
                location_id INTEGER,
                FOREIGN KEY (location_id) REFERENCES location(id)
            );

            -- 设备保障资源关联
            CREATE TABLE equipment_support (
                id INTEGER PRIMARY KEY,
                equipment_id INTEGER,
                resource_id INTEGER,
                FOREIGN KEY (equipment_id) REFERENCES equipment(id),
                FOREIGN KEY (resource_id) REFERENCES support_resource(id)
            );
        """)

        # 插入基础数据
        _insert_base_data(c)
        _insert_procurement_data(c)
        _insert_test_data(c)
        _insert_maintenance_data(c)

        c.commit()
        print(f"数据库初始化完成: {db_path}")


def _insert_base_data(c: sqlite3.Connection) -> None:
    """插入基础数据：位置、厂家、供应商、设备"""

    # 部署位置
    locations = [
        (1, '一号厂区', '工厂', None, '主生产厂区'),
        (2, '二号厂区', '工厂', None, '辅助生产厂区'),
        (3, 'A产线', '产线', 1, '核心生产线'),
        (4, 'B产线', '产线', 1, '辅助生产线'),
        (5, 'C产线', '产线', 2, '试验产线'),
        (6, '仓储区', '仓库', None, '备件仓库'),
        (7, '试验中心', '试验场地', None, '设备试验鉴定中心'),
        (8, '维修车间', '维修场地', None, '设备维修保障中心'),
    ]
    c.executemany("INSERT INTO location VALUES(?,?,?,?,?)", locations)

    # 生产厂家
    manufacturers = [
        (1, '华北智造', 'A', '010-10001', '北京市海淀区', 2005),
        (2, '深蓝机电', 'A', '0755-20002', '深圳市南山区', 2010),
        (3, '江南传感', 'B', '021-30003', '上海市浦东新区', 2015),
        (4, '远航自动化', 'B', '020-40004', '广州市天河区', 2012),
        (5, '北辰仪表', 'C', '010-50005', '北京市朝阳区', 2018),
        (6, '东方重工', 'A', '022-60006', '天津市滨海新区', 2000),
        (7, '精密传动科技', 'A', '0571-70007', '杭州市余杭区', 2008),
    ]
    c.executemany("INSERT INTO manufacturer VALUES(?,?,?,?,?,?)", manufacturers)

    # 供应商
    suppliers = [
        (1, '安信供应', 'A', '低', '010-11111', '北京市'),
        (2, '鸿图贸易', 'B', '中', '0755-22222', '深圳市'),
        (3, '启明集采', 'C', '高', '021-33333', '上海市'),
        (4, '瑞诚工业', 'B', '中', '020-44444', '广州市'),
        (5, '泽源设备', 'A', '低', '010-55555', '北京市'),
        (6, '恒达备件', 'A', '低', '022-66666', '天津市'),
        (7, '华通物资', 'B', '中', '0571-77777', '杭州市'),
    ]
    c.executemany("INSERT INTO supplier VALUES(?,?,?,?,?,?)", suppliers)

    # 设备
    equipments = [
        (1, '空压机A', 'KA-100', '动力', 1, '正常', 3, 1, '关键', '2023-01-15', '2023-03-01', 10, 'EQ-2023-001'),
        (2, '焊接机器人B', 'WB-20', '机器人', 2, '异常', 4, 3, '关键', '2023-02-20', '2023-04-15', 8, 'EQ-2023-002'),
        (3, '温度传感器C', 'TS-9', '传感器', 3, '正常', 3, 2, '一般', '2023-03-10', '2023-05-01', 5, 'EQ-2023-003'),
        (4, '数控机床D', 'NC-500', '机床', 4, '维修中', 4, 4, '关键', '2022-12-01', '2023-02-01', 15, 'EQ-2022-004'),
        (5, '包装机E', 'PK-88', '包装', 5, '异常', 5, 3, '一般', '2023-06-01', '2023-08-01', 8, 'EQ-2023-005'),
        (6, 'AGV小车F', 'AGV-3', '物流', 2, '正常', 5, 5, '一般', '2023-04-15', '2023-06-01', 6, 'EQ-2023-006'),
        (7, '液压机G', 'HY-200', '液压', 6, '正常', 3, 1, '关键', '2022-06-01', '2022-08-15', 12, 'EQ-2022-007'),
        (8, '检测仪H', 'DT-50', '检测', 5, '正常', 7, 5, '一般', '2024-01-10', '2024-03-01', 7, 'EQ-2024-008'),
        (9, '变频器I', 'VF-30', '电气', 7, '正常', 3, 2, '一般', '2023-09-01', '2023-11-01', 10, 'EQ-2023-009'),
        (10, '减速机J', 'RD-60', '传动', 7, '故障', 4, 4, '关键', '2021-03-15', '2021-06-01', 10, 'EQ-2021-010'),
    ]
    c.executemany("INSERT INTO equipment VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", equipments)


def _insert_procurement_data(c: sqlite3.Connection) -> None:
    """插入采购领域数据"""

    # 采购计划
    plans = [
        (1, '2024年空压机采购计划', 2024, 1, 2, 250000, '已执行', '2024-01-15', '张主任'),
        (2, '2024年焊接机器人采购计划', 2024, 2, 1, 900000, '已执行', '2024-02-01', '李经理'),
        (3, '2024年检测设备采购计划', 2024, 8, 3, 180000, '已执行', '2024-01-20', '张主任'),
        (4, '2025年AGV小车采购计划', 2025, 6, 5, 500000, '待审批', None, None),
        (5, '2025年液压机采购计划', 2025, 7, 1, 350000, '审批中', None, '王总监'),
    ]
    c.executemany("INSERT INTO procurement_plan VALUES(?,?,?,?,?,?,?,?,?)", plans)

    # 招标项目
    tenders = [
        (1, '2024年空压机招标项目', 1, '公开招标', '2024-02-01', '2024-03-01', '已完成', 1),
        (2, '2024年焊接机器人招标项目', 2, '邀请招标', '2024-03-01', '2024-03-20', '已完成', 3),
        (3, '2024年检测设备招标项目', 3, '竞争性谈判', '2024-02-15', '2024-03-05', '已完成', 5),
        (4, '2025年AGV小车招标项目', 4, '公开招标', '2025-01-15', '2025-02-15', '准备中', None),
    ]
    c.executemany("INSERT INTO tender_project VALUES(?,?,?,?,?,?,?,?)", tenders)

    # 采购合同
    contracts = [
        (1, 'HT-2024-001', 1, 1, 1, 240000, '2024-03-15', '2024-05-01', '已完成', '30%预付，70%验收后付'),
        (2, 'HT-2024-002', 2, 3, 2, 860000, '2024-04-01', '2024-07-01', '执行中', '50%预付，50%验收后付'),
        (3, 'HT-2024-003', 8, 5, 3, 150000, '2024-03-20', '2024-05-15', '已完成', '全额预付'),
        (4, 'HT-2023-010', 4, 4, None, 530000, '2023-01-10', '2023-04-01', '已完成', '40%预付，60%验收后付'),
        (5, 'HT-2023-011', 7, 1, None, 320000, '2023-05-01', '2023-08-01', '已完成', '30%预付，70%验收后付'),
    ]
    c.executemany("INSERT INTO purchase_contract VALUES(?,?,?,?,?,?,?,?,?,?)", contracts)

    # 验收记录
    acceptances = [
        (1, 'YS-2024-001', 1, 1, '2024-05-10', '合格', '王工', '设备运行正常'),
        (2, 'YS-2024-002', 3, 8, '2024-05-20', '合格', '李工', '精度达标'),
        (3, 'YS-2023-001', 4, 4, '2023-04-15', '合格', '周工', '验收通过'),
        (4, 'YS-2023-002', 5, 7, '2023-08-10', '合格', '赵工', '压力测试通过'),
        (5, 'YS-2024-003', 2, 2, '2024-07-15', '待验收', None, '等待安装调试'),
    ]
    c.executemany("INSERT INTO acceptance_record VALUES(?,?,?,?,?,?,?,?)", acceptances)


def _insert_test_data(c: sqlite3.Connection) -> None:
    """插入试验鉴定领域数据"""

    # 试验项目
    projects = [
        (1, '空压机A出厂性能试验', 1, '出厂试验', '2023-02-01', '2023-02-15', '已完成', '通过', '张工'),
        (2, '焊接机器人B精度检测试验', 2, '精度检测', '2023-03-20', '2023-04-10', '已完成', '通过', '李工'),
        (3, '数控机床D可靠性试验', 4, '可靠性试验', '2023-05-01', '2023-08-01', '已完成', '通过', '周工'),
        (4, '液压机G耐久性试验', 7, '耐久性试验', '2023-09-01', '2023-12-01', '已完成', '通过', '赵工'),
        (5, '检测仪H校准试验', 8, '校准试验', '2024-03-10', '2024-03-25', '已完成', '通过', '王工'),
        (6, '减速机J故障诊断试验', 10, '故障诊断', '2024-06-01', '2024-07-15', '进行中', None, '陈工'),
        (7, 'AGV小车F导航精度试验', 6, '导航精度', '2024-04-01', '2024-04-20', '已完成', '不通过', '李工'),
    ]
    c.executemany("INSERT INTO test_project VALUES(?,?,?,?,?,?,?,?,?)", projects)

    # 试验方案
    plans = [
        (1, '空压机性能测试方案', 1, '温度25℃，湿度60%', '排气量、功率、振动、噪声', '排气量≥100L/min，功率≤5kW', '张工'),
        (2, '焊接精度检测方案', 2, '恒温车间', '重复定位精度、焊缝质量', '重复定位精度≤0.05mm', '李工'),
        (3, '可靠性试验方案', 3, '正常生产环境', '连续运行72小时、故障率', '故障率<1%', '周工'),
        (4, '耐久性试验方案', 4, '满载工况', '连续运行500小时、磨损量', '磨损量<0.1mm', '赵工'),
        (5, '校准试验方案', 5, '标准环境', '精度、稳定性、重复性', '精度误差<0.5%', '王工'),
        (6, '故障诊断试验方案', 6, '模拟故障工况', '振动分析、温度监测', '诊断准确率>90%', '陈工'),
        (7, '导航精度试验方案', 7, '标准测试场地', '定位精度、路径跟踪', '定位精度±10mm', '李工'),
    ]
    c.executemany("INSERT INTO test_plan VALUES(?,?,?,?,?,?,?)", plans)

    # 试验数据
    test_datas = [
        # 空压机试验数据
        (1, 1, '排气量', 105, 100, 'L/min', 1, '2023-02-05', '张工'),
        (2, 1, '功率', 4.8, 5, 'kW', 1, '2023-02-05', '张工'),
        (3, 1, '振动', 2.1, 3, 'mm/s', 1, '2023-02-06', '张工'),
        (4, 1, '噪声', 72, 75, 'dB', 1, '2023-02-06', '张工'),
        # 焊接机器人试验数据
        (5, 2, '重复定位精度', 0.03, 0.05, 'mm', 1, '2023-03-25', '李工'),
        (6, 2, '焊缝合格率', 98, 95, '%', 1, '2023-03-26', '李工'),
        # 数控机床可靠性试验数据
        (7, 3, '连续运行时间', 72, 72, '小时', 1, '2023-08-01', '周工'),
        (8, 3, '故障次数', 0, 1, '次', 1, '2023-08-01', '周工'),
        # 液压机耐久性试验数据
        (9, 4, '运行时间', 500, 500, '小时', 1, '2023-12-01', '赵工'),
        (10, 4, '磨损量', 0.05, 0.1, 'mm', 1, '2023-12-01', '赵工'),
        # 检测仪校准试验数据
        (11, 5, '精度误差', 0.3, 0.5, '%', 1, '2024-03-20', '王工'),
        (12, 5, '稳定性', 0.1, 0.2, '%', 1, '2024-03-20', '王工'),
        # 减速机故障诊断试验数据
        (13, 6, '振动幅值', 8.5, 10, 'mm/s', 1, '2024-06-15', '陈工'),
        (14, 6, '温度升高', 25, 30, '℃', 1, '2024-06-15', '陈工'),
        # AGV导航精度试验数据（未通过）
        (15, 7, '定位精度', 15, 10, 'mm', 0, '2024-04-10', '李工'),
        (16, 7, '路径跟踪误差', 12, 8, 'mm', 0, '2024-04-10', '李工'),
    ]
    c.executemany("INSERT INTO test_data VALUES(?,?,?,?,?,?,?,?,?)", test_datas)

    # 鉴定结论
    conclusions = [
        (1, 'JD-2023-001', 1, '2023-02-20', '通过', '张教授、李高工、王工程师', '各项指标达标，同意出厂'),
        (2, 'JD-2023-002', 2, '2023-04-15', '通过', '李教授、赵高工、刘工程师', '精度满足要求'),
        (3, 'JD-2023-003', 3, '2023-08-10', '通过', '周教授、陈高工、孙工程师', '可靠性达标'),
        (4, 'JD-2023-004', 4, '2023-12-10', '通过', '赵教授、钱高工、吴工程师', '耐久性满足要求'),
        (5, 'JD-2024-001', 5, '2024-03-28', '通过', '王教授、郑高工、冯工程师', '校准合格'),
        (6, 'JD-2024-002', 7, '2024-04-25', '不通过', '李教授、周高工、吴工程师', '导航精度不达标，需改进'),
    ]
    c.executemany("INSERT INTO appraisal_conclusion VALUES(?,?,?,?,?,?,?)", conclusions)


def _insert_maintenance_data(c: sqlite3.Connection) -> None:
    """插入维修保障领域数据"""

    # 故障模式
    failure_modes = [
        (1, '轴承磨损', '机械', '中', '振动检测', '轴承因长期运行产生磨损'),
        (2, '电机过热', '电气', '高', '温度监测', '电机负载过大或散热不良'),
        (3, '密封泄漏', '液压', '中', '目视检查', '密封件老化导致泄漏'),
        (4, '传感器漂移', '仪表', '低', '校准检测', '传感器精度随时间漂移'),
        (5, '控制系统故障', '电气', '高', '诊断程序', '控制器程序异常或硬件故障'),
        (6, '传动皮带断裂', '机械', '中', '目视检查', '皮带老化或过载断裂'),
        (7, '液压泵故障', '液压', '高', '压力测试', '液压泵磨损或损坏'),
        (8, '焊缝偏移', '焊接', '中', '视觉检测', '焊接位置偏差'),
        (9, '伺服报警', '电气', '高', '诊断程序', '伺服驱动器异常报警'),
        (10, '视觉定位失败', '视觉', '中', '系统诊断', '视觉系统识别异常'),
    ]
    c.executemany("INSERT INTO failure_mode VALUES(?,?,?,?,?,?)", failure_modes)

    # 设备故障模式关联 (id, equipment_id, failure_mode_id, occurrence_probability)
    eq_failure = [
        (1, 1, 1, '中'), (2, 1, 2, '低'),
        (3, 2, 5, '高'), (4, 2, 8, '中'), (5, 2, 9, '高'), (6, 2, 10, '中'),
        (7, 3, 4, '低'),
        (8, 4, 1, '中'), (9, 4, 5, '中'),
        (10, 5, 6, '中'),
        (11, 7, 3, '低'), (12, 7, 7, '低'),
        (13, 10, 1, '高'), (14, 10, 2, '高'),
    ]
    c.executemany("INSERT INTO equipment_failure_mode VALUES(?,?,?,?)", eq_failure)

    # 维修计划
    plans = [
        (1, '空压机A季度保养', 1, '定期保养', '2024-06-01', '已完成', '普通'),
        (2, '焊接机器人B紧急维修', 2, '故障维修', '2024-05-15', '已完成', '紧急'),
        (3, '数控机床D大修计划', 4, '大修', '2024-07-01', '执行中', '重要'),
        (4, '包装机E故障维修', 5, '故障维修', '2024-05-20', '已完成', '紧急'),
        (5, 'AGV小车F年度保养', 6, '定期保养', '2024-08-01', '待执行', '普通'),
        (6, '液压机G季度检查', 7, '定期检查', '2024-06-15', '已完成', '普通'),
        (7, '减速机J故障维修', 10, '故障维修', '2024-06-10', '执行中', '紧急'),
        (8, '检测仪H年度校准', 8, '定期校准', '2024-09-01', '待执行', '普通'),
    ]
    c.executemany("INSERT INTO maintenance_plan VALUES(?,?,?,?,?,?,?)", plans)

    # 维修工单
    orders = [
        (1, 'GD-2024-001', 1, 1, 1, '轴承异响', '更换轴承', '2024-06-01 08:00', '2024-06-01 12:00', '王工', '已完成', '中', 500),
        (2, 'GD-2024-002', 2, 2, 5, '控制系统报警', '更换控制板', '2024-05-15 10:00', '2024-05-16 18:00', '李工', '已完成', '高', 12000),
        (3, 'GD-2024-003', 2, 2, 9, '伺服报警', '更换伺服驱动器', '2024-05-16 09:00', '2024-05-17 16:00', '李工', '已完成', '高', 8500),
        (4, 'GD-2024-004', 4, 3, 1, '主轴异响', '更换主轴轴承', '2024-07-01 08:00', None, '周工', '进行中', '高', 15000),
        (5, 'GD-2024-005', 5, 4, 6, '封口不良', '更换加热条', '2024-05-20 14:00', '2024-05-20 18:00', '陈工', '已完成', '中', 300),
        (6, 'GD-2024-006', 5, 4, 6, '传送带抖动', '调整张紧装置', '2024-05-21 09:00', '2024-05-21 11:00', '陈工', '已完成', '低', 100),
        (7, 'GD-2024-007', 7, 6, 3, '液压油泄漏', '更换密封圈', '2024-06-15 10:00', '2024-06-15 15:00', '赵工', '已完成', '中', 800),
        (8, 'GD-2024-008', 10, 7, 1, '轴承严重磨损', '更换减速机总成', '2024-06-10 08:00', None, '陈工', '进行中', '高', 35000),
        (9, 'GD-2024-009', 10, 7, 2, '电机过热', '更换散热风扇', '2024-06-12 14:00', '2024-06-12 17:00', '陈工', '已完成', '中', 600),
        (10, 'GD-2024-010', 3, None, 4, '温度读数偏差', '重新校准传感器', '2024-06-20 09:00', '2024-06-20 12:00', '王工', '已完成', '低', 200),
    ]
    c.executemany("INSERT INTO maintenance_order VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", orders)

    # 备件
    spares = [
        (1, '轴承6205', 'BRG-6205', '轴承', 20, 10, 85, 6),
        (2, '轴承6308', 'BRG-6308', '轴承', 15, 8, 150, 6),
        (3, '伺服驱动器', 'SVO-100', '电气', 3, 2, 5000, 7),
        (4, '控制板', 'CTL-200', '电气', 2, 1, 8000, 7),
        (5, '加热条', 'HT-500', '加热', 10, 5, 120, 6),
        (6, '密封圈套件', 'SEAL-KIT', '密封', 30, 15, 45, 6),
        (7, '传送带', 'CV-1000', '传动', 5, 3, 350, 7),
        (8, '散热风扇', 'FN-120', '散热', 25, 10, 60, 6),
        (9, '液压油', 'HO-46', '油品', 50, 20, 120, 6),
        (10, '传感器TS-9', 'SNS-TS9', '传感器', 8, 5, 800, 3),
        (11, '减速机总成', 'RD-60-ASM', '传动', 1, 1, 25000, 7),
        (12, '焊接头', 'WH-20', '焊接', 6, 3, 1500, 2),
    ]
    c.executemany("INSERT INTO spare_part VALUES(?,?,?,?,?,?,?,?)", spares)

    # 备件使用记录
    usages = [
        (1, 1, 2, 1, '2024-06-01'),
        (2, 2, 4, 1, '2024-05-15'),
        (3, 3, 3, 1, '2024-05-16'),
        (4, 4, 2, 2, '2024-07-01'),
        (5, 5, 5, 1, '2024-05-20'),
        (6, 7, 6, 4, '2024-06-15'),
        (7, 8, 11, 1, '2024-06-10'),
        (8, 9, 8, 2, '2024-06-12'),
        (9, 10, 10, 1, '2024-06-20'),
    ]
    c.executemany("INSERT INTO spare_usage VALUES(?,?,?,?,?)", usages)

    # 保障资源
    resources = [
        (1, '维修工具套装A', '工具', 3, '可用', 8),
        (2, '液压千斤顶', '工具', 2, '可用', 8),
        (3, '电焊机', '设备', 1, '可用', 8),
        (4, '示波器', '仪器', 2, '可用', 8),
        (5, '振动分析仪', '仪器', 1, '可用', 8),
        (6, '红外热像仪', '仪器', 1, '可用', 8),
        (7, '维修叉车', '车辆', 1, '可用', 6),
        (8, '技术手册库', '资料', 1, '可用', 8),
    ]
    c.executemany("INSERT INTO support_resource VALUES(?,?,?,?,?,?)", resources)

    # 设备保障资源关联 (id, equipment_id, resource_id)
    eq_support = [
        (1, 1, 1), (2, 1, 2), (3, 1, 5),
        (4, 2, 1), (5, 2, 3), (6, 2, 4),
        (7, 4, 1), (8, 4, 2), (9, 4, 5), (10, 4, 6),
        (11, 7, 1), (12, 7, 2), (13, 7, 6),
        (14, 10, 1), (15, 10, 2), (16, 10, 5),
    ]
    c.executemany("INSERT INTO equipment_support VALUES(?,?,?)", eq_support)


if __name__ == '__main__':
    from pathlib import Path
    data_dir = Path(__file__).resolve().parents[1] / "data"
    data_dir.mkdir(exist_ok=True)
    init_equipment_db(data_dir / "equipment_demo.db")
