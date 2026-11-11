from modules.network_monitor import internet_check,network_info
from modules.ip_checker import get_ip_info
from modules.dns_checker import dns_test
from modules.vpn_checker import vpn_status
def run_audit():
    ip=get_ip_info(); n=network_info(); vpn=vpn_status()
    return [
      ("Internet", "PASS" if internet_check() else "FAIL", "Connectivity test"),
      ("Local IP", "PASS" if n.get("local_ip") else "WARNING", n.get("local_ip") or "Unavailable"),
      ("Public IPv4", "PASS" if ip.get("ipv4") else "WARNING", ip.get("ipv4") or "Lookup unavailable"),
      ("IPv6", "WARNING", ip.get("ipv6") or "Not detected; cannot conclude IPv6 is disabled"),
      ("VPN", "WARNING", vpn),
      ("DNS", "WARNING", dns_test()+"; encryption/leak status not verified"),
    ]
