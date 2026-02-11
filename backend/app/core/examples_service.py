import io

import pandapower as pp
import pandapower.networks as pn

from ..logging_config import get_logger

logger = get_logger(__name__)

# Network categories matching pandapower documentation structure.
# Each category contains networks with: loader function, display name, zh/en descriptions.
# Bus counts are hardcoded to avoid loading all networks on startup (~24s penalty).
NETWORK_CATEGORIES = {
    "test_cases": {
        "name_zh": "电力系统测试用例",
        "name_en": "Power System Test Cases",
        "networks": {
            "case4gs": {
                "loader": pn.case4gs,
                "display_name": "Case 4 GS",
                "description_zh": "4节点测试系统（Grainger & Stevenson）",
                "description_en": "4-bus test case (Grainger & Stevenson)",
                "bus_count": 4,
            },
            "case5": {
                "loader": pn.case5,
                "display_name": "Case 5",
                "description_zh": "5节点PJM测试系统",
                "description_en": "5-bus PJM test case",
                "bus_count": 5,
            },
            "case6ww": {
                "loader": pn.case6ww,
                "display_name": "Case 6 WW",
                "description_zh": "6节点测试系统（Wood & Wollenberg）",
                "description_en": "6-bus test case (Wood & Wollenberg)",
                "bus_count": 6,
            },
            "case9": {
                "loader": pn.case9,
                "display_name": "Case 9",
                "description_zh": "9节点WSCC测试系统",
                "description_en": "9-bus WSCC test case",
                "bus_count": 9,
            },
            "case11_iwamoto": {
                "loader": pn.case11_iwamoto,
                "display_name": "Case 11 Iwamoto",
                "description_zh": "11节点Iwamoto测试系统",
                "description_en": "11-bus Iwamoto test case",
                "bus_count": 11,
            },
            "case14": {
                "loader": pn.case14,
                "display_name": "Case 14",
                "description_zh": "IEEE 14节点标准测试系统",
                "description_en": "IEEE 14-bus standard test case",
                "bus_count": 14,
            },
            "case24_ieee_rts": {
                "loader": pn.case24_ieee_rts,
                "display_name": "Case 24 IEEE RTS",
                "description_zh": "IEEE 24节点可靠性测试系统",
                "description_en": "IEEE 24-bus Reliability Test System",
                "bus_count": 24,
            },
            "GBreducednetwork": {
                "loader": pn.GBreducednetwork,
                "display_name": "GB Reduced",
                "description_zh": "英国电网简化模型",
                "description_en": "Great Britain reduced transmission network",
                "bus_count": 29,
            },
            "case30": {
                "loader": pn.case30,
                "display_name": "Case 30",
                "description_zh": "IEEE 30节点标准测试系统",
                "description_en": "IEEE 30-bus standard test case",
                "bus_count": 30,
            },
            "case_ieee30": {
                "loader": pn.case_ieee30,
                "display_name": "Case IEEE 30",
                "description_zh": "IEEE 30节点系统（含元件参数）",
                "description_en": "IEEE 30-bus system (with component parameters)",
                "bus_count": 30,
            },
            "case33bw": {
                "loader": pn.case33bw,
                "display_name": "Case 33 BW",
                "description_zh": "33节点配电网测试系统（Baran & Wu）",
                "description_en": "33-bus distribution test case (Baran & Wu)",
                "bus_count": 33,
            },
            "case39": {
                "loader": pn.case39,
                "display_name": "Case 39",
                "description_zh": "39节点新英格兰测试系统",
                "description_en": "39-bus New England test case",
                "bus_count": 39,
            },
            "case57": {
                "loader": pn.case57,
                "display_name": "Case 57",
                "description_zh": "IEEE 57节点标准测试系统",
                "description_en": "IEEE 57-bus standard test case",
                "bus_count": 57,
            },
            "case89pegase": {
                "loader": pn.case89pegase,
                "display_name": "Case 89 PEGASE",
                "description_zh": "89节点PEGASE欧洲电网测试系统",
                "description_en": "89-bus PEGASE European grid test case",
                "bus_count": 89,
            },
            "case118": {
                "loader": pn.case118,
                "display_name": "Case 118",
                "description_zh": "IEEE 118节点标准测试系统",
                "description_en": "IEEE 118-bus standard test case",
                "bus_count": 118,
            },
            "case145": {
                "loader": pn.case145,
                "display_name": "Case 145",
                "description_zh": "145节点动态测试系统",
                "description_en": "145-bus dynamic test case",
                "bus_count": 145,
            },
            "iceland": {
                "loader": pn.iceland,
                "display_name": "Iceland",
                "description_zh": "冰岛电力传输网络",
                "description_en": "Iceland electricity transmission network",
                "bus_count": 189,
            },
            "case_illinois200": {
                "loader": pn.case_illinois200,
                "display_name": "Case Illinois 200",
                "description_zh": "200节点伊利诺伊合成电网",
                "description_en": "200-bus Illinois synthetic network",
                "bus_count": 200,
            },
            "case300": {
                "loader": pn.case300,
                "display_name": "Case 300",
                "description_zh": "300节点大型输电系统",
                "description_en": "300-bus large transmission system",
                "bus_count": 300,
            },
            "case1354pegase": {
                "loader": pn.case1354pegase,
                "display_name": "Case 1354 PEGASE",
                "description_zh": "1354节点PEGASE欧洲高压输电网",
                "description_en": "1354-bus PEGASE European HV transmission network",
                "bus_count": 1354,
            },
            "case1888rte": {
                "loader": pn.case1888rte,
                "display_name": "Case 1888 RTE",
                "description_zh": "1888节点法国超高压/高压输电网",
                "description_en": "1888-bus French VHV/HV transmission network",
                "bus_count": 1888,
            },
            "GBnetwork": {
                "loader": pn.GBnetwork,
                "display_name": "GB Network",
                "description_zh": "英国电力传输网络",
                "description_en": "Great Britain electricity transmission network",
                "bus_count": 2224,
            },
            "case2848rte": {
                "loader": pn.case2848rte,
                "display_name": "Case 2848 RTE",
                "description_zh": "2848节点法国超高压/高压输电网",
                "description_en": "2848-bus French VHV/HV transmission network",
                "bus_count": 2848,
            },
            "case2869pegase": {
                "loader": pn.case2869pegase,
                "display_name": "Case 2869 PEGASE",
                "description_zh": "2869节点PEGASE欧洲高压输电网",
                "description_en": "2869-bus PEGASE European HV transmission network",
                "bus_count": 2869,
            },
            "case3120sp": {
                "loader": pn.case3120sp,
                "display_name": "Case 3120 SP",
                "description_zh": "3120节点波兰400/220/110kV电网",
                "description_en": "3120-bus Polish 400/220/110 kV network",
                "bus_count": 3120,
            },
            "case6470rte": {
                "loader": pn.case6470rte,
                "display_name": "Case 6470 RTE",
                "description_zh": "6470节点法国输电网络",
                "description_en": "6470-bus French transmission network",
                "bus_count": 6470,
            },
            "case6495rte": {
                "loader": pn.case6495rte,
                "display_name": "Case 6495 RTE",
                "description_zh": "6495节点法国输电网络",
                "description_en": "6495-bus French transmission network",
                "bus_count": 6495,
            },
            "case6515rte": {
                "loader": pn.case6515rte,
                "display_name": "Case 6515 RTE",
                "description_zh": "6515节点法国输电网络",
                "description_en": "6515-bus French transmission network",
                "bus_count": 6515,
            },
            "case9241pegase": {
                "loader": pn.case9241pegase,
                "display_name": "Case 9241 PEGASE",
                "description_zh": "9241节点PEGASE大型欧洲高压输电网",
                "description_en": "9241-bus PEGASE large European HV transmission network",
                "bus_count": 9241,
            },
        },
    },
    "example": {
        "name_zh": "示例网络",
        "name_en": "Example Networks",
        "networks": {
            "example_simple": {
                "loader": pn.example_simple,
                "display_name": "Simple Example",
                "description_zh": "pandapower 教程简单示例网络",
                "description_en": "Simple example network from pandapower tutorials",
                "bus_count": 7,
            },
            "example_multivoltage": {
                "loader": pn.example_multivoltage,
                "display_name": "Multi-Voltage Example",
                "description_zh": "pandapower 教程多电压等级示例网络",
                "description_en": "Multi-voltage level example from pandapower tutorials",
                "bus_count": 57,
            },
        },
    },
    "simple_test": {
        "name_zh": "简单测试网络",
        "name_en": "Simple Test Networks",
        "networks": {
            "simple_four_bus_system": {
                "loader": pn.simple_four_bus_system,
                "display_name": "Simple Four Bus",
                "description_zh": "简单四节点系统",
                "description_en": "Simple four bus system",
                "bus_count": 4,
            },
            "panda_four_load_branch": {
                "loader": pn.panda_four_load_branch,
                "display_name": "Four Load Branch",
                "description_zh": "四负荷支路测试网络",
                "description_en": "Four load branch test network",
                "bus_count": 6,
            },
            "simple_mv_open_ring_net": {
                "loader": pn.simple_mv_open_ring_net,
                "display_name": "MV Open Ring",
                "description_zh": "中压开环网络",
                "description_en": "Medium voltage open ring network",
                "bus_count": 7,
            },
            "four_loads_with_branches_out": {
                "loader": pn.four_loads_with_branches_out,
                "display_name": "Four Loads with Branches",
                "description_zh": "四负荷带分支测试网络",
                "description_en": "Four loads with branches out test network",
                "bus_count": 10,
            },
        },
    },
    "cigre": {
        "name_zh": "CIGRE 网络",
        "name_en": "CIGRE Networks",
        "networks": {
            "create_cigre_network_hv": {
                "loader": pn.create_cigre_network_hv,
                "display_name": "CIGRE HV",
                "description_zh": "CIGRE 高压输电网络",
                "description_en": "CIGRE high voltage transmission network",
                "bus_count": 13,
            },
            "create_cigre_network_mv": {
                "loader": pn.create_cigre_network_mv,
                "display_name": "CIGRE MV",
                "description_zh": "CIGRE 中压配电网络",
                "description_en": "CIGRE medium voltage distribution network",
                "bus_count": 15,
            },
            "create_cigre_network_lv": {
                "loader": pn.create_cigre_network_lv,
                "display_name": "CIGRE LV",
                "description_zh": "CIGRE 低压配电网络",
                "description_en": "CIGRE low voltage distribution network",
                "bus_count": 44,
            },
        },
    },
    "mv_oberrhein": {
        "name_zh": "MV Oberrhein 网络",
        "name_en": "MV Oberrhein",
        "networks": {
            "mv_oberrhein": {
                "loader": pn.mv_oberrhein,
                "display_name": "MV Oberrhein",
                "description_zh": "上莱茵地区20kV中压配电网络",
                "description_en": "Oberrhein generic 20 kV distribution network",
                "bus_count": 179,
            },
        },
    },
    "kerber": {
        "name_zh": "Kerber 网络",
        "name_en": "Kerber Networks",
        "networks": {
            # Average Kerber networks
            "create_kerber_landnetz_freileitung_2": {
                "loader": pn.create_kerber_landnetz_freileitung_2,
                "display_name": "Landnetz Freileitung 2",
                "description_zh": "Kerber 农村架空线网络 2",
                "description_en": "Kerber rural overhead line network 2",
                "bus_count": 10,
            },
            "create_kerber_landnetz_freileitung_1": {
                "loader": pn.create_kerber_landnetz_freileitung_1,
                "display_name": "Landnetz Freileitung 1",
                "description_zh": "Kerber 农村架空线网络 1",
                "description_en": "Kerber rural overhead line network 1",
                "bus_count": 15,
            },
            "create_kerber_landnetz_kabel_1": {
                "loader": pn.create_kerber_landnetz_kabel_1,
                "display_name": "Landnetz Kabel 1",
                "description_zh": "Kerber 农村电缆网络 1",
                "description_en": "Kerber rural cable network 1",
                "bus_count": 18,
            },
            "kb_extrem_landnetz_freileitung": {
                "loader": pn.kb_extrem_landnetz_freileitung,
                "display_name": "Extrem Landnetz Freileitung",
                "description_zh": "Kerber 极端农村架空线网络",
                "description_en": "Kerber extreme rural overhead line network",
                "bus_count": 28,
            },
            "kb_extrem_landnetz_freileitung_trafo": {
                "loader": pn.kb_extrem_landnetz_freileitung_trafo,
                "display_name": "Extrem Landnetz Freil. Trafo",
                "description_zh": "Kerber 极端农村架空线+变压器网络",
                "description_en": "Kerber extreme rural overhead line with trafo",
                "bus_count": 29,
            },
            "create_kerber_landnetz_kabel_2": {
                "loader": pn.create_kerber_landnetz_kabel_2,
                "display_name": "Landnetz Kabel 2",
                "description_zh": "Kerber 农村电缆网络 2",
                "description_en": "Kerber rural cable network 2",
                "bus_count": 30,
            },
            "kb_extrem_landnetz_kabel": {
                "loader": pn.kb_extrem_landnetz_kabel,
                "display_name": "Extrem Landnetz Kabel",
                "description_zh": "Kerber 极端农村电缆网络",
                "description_en": "Kerber extreme rural cable network",
                "bus_count": 54,
            },
            "kb_extrem_landnetz_kabel_trafo": {
                "loader": pn.kb_extrem_landnetz_kabel_trafo,
                "display_name": "Extrem Landnetz Kabel Trafo",
                "description_zh": "Kerber 极端农村电缆+变压器网络",
                "description_en": "Kerber extreme rural cable with trafo",
                "bus_count": 56,
            },
            "create_kerber_dorfnetz": {
                "loader": pn.create_kerber_dorfnetz,
                "display_name": "Dorfnetz",
                "description_zh": "Kerber 村庄网络",
                "description_en": "Kerber village network",
                "bus_count": 116,
            },
            "kb_extrem_dorfnetz": {
                "loader": pn.kb_extrem_dorfnetz,
                "display_name": "Extrem Dorfnetz",
                "description_zh": "Kerber 极端村庄网络",
                "description_en": "Kerber extreme village network",
                "bus_count": 118,
            },
            "kb_extrem_dorfnetz_trafo": {
                "loader": pn.kb_extrem_dorfnetz_trafo,
                "display_name": "Extrem Dorfnetz Trafo",
                "description_zh": "Kerber 极端村庄+变压器网络",
                "description_en": "Kerber extreme village with trafo",
                "bus_count": 236,
            },
            "create_kerber_vorstadtnetz_kabel_2": {
                "loader": pn.create_kerber_vorstadtnetz_kabel_2,
                "display_name": "Vorstadtnetz Kabel 2",
                "description_zh": "Kerber 郊区电缆网络 2",
                "description_en": "Kerber suburban cable network 2",
                "bus_count": 290,
            },
            "kb_extrem_vorstadtnetz_1": {
                "loader": pn.kb_extrem_vorstadtnetz_1,
                "display_name": "Extrem Vorstadtnetz 1",
                "description_zh": "Kerber 极端郊区网络 1",
                "description_en": "Kerber extreme suburban network 1",
                "bus_count": 292,
            },
            "kb_extrem_vorstadtnetz_2": {
                "loader": pn.kb_extrem_vorstadtnetz_2,
                "display_name": "Extrem Vorstadtnetz 2",
                "description_zh": "Kerber 极端郊区网络 2",
                "description_en": "Kerber extreme suburban network 2",
                "bus_count": 292,
            },
            "create_kerber_vorstadtnetz_kabel_1": {
                "loader": pn.create_kerber_vorstadtnetz_kabel_1,
                "display_name": "Vorstadtnetz Kabel 1",
                "description_zh": "Kerber 郊区电缆网络 1",
                "description_en": "Kerber suburban cable network 1",
                "bus_count": 294,
            },
            "kb_extrem_vorstadtnetz_trafo_1": {
                "loader": pn.kb_extrem_vorstadtnetz_trafo_1,
                "display_name": "Extrem Vorstadtnetz Trafo 1",
                "description_zh": "Kerber 极端郊区+变压器网络 1",
                "description_en": "Kerber extreme suburban with trafo 1",
                "bus_count": 384,
            },
            "kb_extrem_vorstadtnetz_trafo_2": {
                "loader": pn.kb_extrem_vorstadtnetz_trafo_2,
                "display_name": "Extrem Vorstadtnetz Trafo 2",
                "description_zh": "Kerber 极端郊区+变压器网络 2",
                "description_en": "Kerber extreme suburban with trafo 2",
                "bus_count": 386,
            },
        },
    },
    "synthetic_voltage": {
        "name_zh": "合成电压控制低压网络",
        "name_en": "Synthetic Voltage Control LV",
        "networks": {
            "create_synthetic_voltage_control_lv_network": {
                "loader": pn.create_synthetic_voltage_control_lv_network,
                "display_name": "Synthetic Voltage Control LV",
                "description_zh": "合成电压控制低压网络",
                "description_en": "Synthetic voltage control LV network",
                "bus_count": 26,
            },
        },
    },
    "dickert_lv": {
        "name_zh": "Dickert 低压网络",
        "name_en": "Dickert LV Networks",
        "networks": {
            "create_dickert_lv_network": {
                "loader": pn.create_dickert_lv_network,
                "display_name": "Dickert LV",
                "description_zh": "Dickert 低压配电网络",
                "description_en": "Dickert LV distribution network",
                "bus_count": 3,
            },
        },
    },
    "ieee_european_lv": {
        "name_zh": "IEEE 欧洲低压网络",
        "name_en": "IEEE European LV Asymmetric",
        "networks": {
            "ieee_european_lv_asymmetric": {
                "loader": pn.ieee_european_lv_asymmetric,
                "display_name": "IEEE European LV",
                "description_zh": "IEEE 欧洲低压不对称网络",
                "description_en": "IEEE European LV asymmetric network",
                "bus_count": 907,
            },
        },
    },
    "lv_schutterwald": {
        "name_zh": "LV Schutterwald 网络",
        "name_en": "LV Schutterwald",
        "networks": {
            "lv_schutterwald": {
                "loader": pn.lv_schutterwald,
                "display_name": "LV Schutterwald",
                "description_zh": "Schutterwald 低压配电网络",
                "description_en": "Schutterwald LV distribution network",
                "bus_count": 2940,
            },
        },
    },
}

# Build a flat lookup for download by case_name
_ALL_NETWORKS = {}
for _cat_info in NETWORK_CATEGORIES.values():
    _ALL_NETWORKS.update(_cat_info["networks"])


def get_cached_example_list() -> dict:
    """Return example networks organized by category using pre-computed bus counts."""
    result = {}
    for category_key, cat_info in NETWORK_CATEGORIES.items():
        networks = [
            {
                "case_name": case_name,
                "display_name": info["display_name"],
                "description_zh": info["description_zh"],
                "description_en": info["description_en"],
                "bus_count": info["bus_count"],
            }
            for case_name, info in cat_info["networks"].items()
        ]
        # Networks are already ordered by bus_count in the dict definition
        result[category_key] = {
            "name_zh": cat_info["name_zh"],
            "name_en": cat_info["name_en"],
            "networks": networks,
        }
    return result


def export_example_to_excel(case_name: str) -> bytes:
    """Export an example network to Excel format using pandapower's to_excel."""
    if case_name not in _ALL_NETWORKS:
        raise ValueError(f"Unknown example network: {case_name}")

    info = _ALL_NETWORKS[case_name]
    net = info["loader"]()

    output = io.BytesIO()
    pp.to_excel(net, output)
    output.seek(0)
    return output.read()
