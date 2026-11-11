#!/usr/bin/env python3
"""ANPS V1.0 — Android Network Privacy System | CODE BY NCODE"""
import os, sys, time
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Prompt, Confirm
from rich import box
from modules.ip_checker import get_ip_info
from modules.dns_checker import dns_status, dns_test
from modules.vpn_checker import vpn_status
from modules.network_monitor import network_info, internet_check
from modules.privacy_audit import run_audit

console = Console()

def banner():
    console.clear()
    console.print(Panel.fit(
        "[bold cyan]A N P S[/bold cyan]\\n[white]ANDROID NETWORK PRIVACY SYSTEM[/white]\\n\\n[bold bright_blue]CODE BY NCODE[/bold bright_blue]",
        border_style="cyan", box=box.DOUBLE, padding=(1,4)))
    console.print("[dim]Privacy diagnostics • Android / Termux • Non-root[/dim]\\n")

def dashboard():
    ip=get_ip_info()
    net=network_info()
    vpn=vpn_status()
    dns=dns_status()
    internet=internet_check()
    t=Table(title="ANPS • PRIVACY DASHBOARD",box=box.ROUNDED,border_style="bright_blue")
    t.add_column("CHECK",style="cyan",no_wrap=True); t.add_column("STATUS",style="white")
    t.add_row("Internet", "[green]ONLINE[/green]" if internet else "[red]OFFLINE[/red]")
    t.add_row("VPN (Android)", vpn)
    t.add_row("Public IPv4", ip.get("ipv4") or "Unavailable")
    t.add_row("Public IPv6", ip.get("ipv6") or "Not detected / unavailable")
    t.add_row("Local IP", net.get("local_ip") or "Unavailable")
    t.add_row("Android Private DNS", dns)
    t.add_row("Wi-Fi interface", net.get("wifi_interface") or "Not exposed to Termux")
    console.print(t)
    console.print("[dim]Note: dashboard checks are snapshots, not proof of anonymity or zero leakage.[/dim]")

def menu():
    return Panel(
        "[cyan]01[/cyan]  Privacy Dashboard\\n"
        "[cyan]02[/cyan]  IP Address Checker\\n"
        "[cyan]03[/cyan]  DNS Privacy Diagnostics\\n"
        "[cyan]04[/cyan]  VPN Protection Status\\n"
        "[cyan]05[/cyan]  Network Monitor\\n"
        "[cyan]06[/cyan]  Privacy Audit\\n"
        "[cyan]07[/cyan]  Security Notes\\n"
        "[cyan]08[/cyan]  About NCODE\\n"
        "[cyan]00[/cyan]  Exit",
        title="[bold]MAIN MENU[/bold]",border_style="cyan")

def show_ip():
    x=get_ip_info()
    t=Table(title="IP ADDRESS CHECK",box=box.SIMPLE)
    t.add_column("Type",style="cyan"); t.add_column("Result")
    t.add_row("Public IPv4",x.get("ipv4") or "Unavailable")
    t.add_row("Public IPv6",x.get("ipv6") or "Not detected / unavailable")
    t.add_row("Local IP",network_info().get("local_ip") or "Unavailable")
    console.print(t)
    console.print("[yellow]Public IP lookup contacts configured external IP-check services.[/yellow]")

def show_dns():
    console.print(Panel(dns_status(),title="ANDROID PRIVATE DNS",border_style="cyan"))
    console.print(Panel(dns_test(),title="DNS RESOLUTION TEST",border_style="blue"))
    console.print("[yellow]Termux cannot reliably inspect all Android DNS routing or prove absence of DNS leaks.[/yellow]")

def show_vpn():
    console.print(Panel(vpn_status(),title="VPN STATUS",border_style="cyan"))
    console.print("For stronger protection, use Android Settings → Network/VPN → Always-on VPN and "
                  "Block connections without VPN (if supported and configured).")
    console.print("[yellow]This script does not create or control an Android VPN tunnel.[/yellow]")

def show_network():
    n=network_info()
    t=Table(title="NETWORK SNAPSHOT",box=box.ROUNDED)
    t.add_column("Field",style="cyan"); t.add_column("Value")
    for k,v in n.items(): t.add_row(k.replace("_"," ").title(),str(v or "Unavailable"))
    t.add_row("Internet", "Reachable" if internet_check() else "Not reachable")
    console.print(t)

def notes():
    console.print(Panel(
        "[bold cyan]REALISTIC PRIVACY NOTES[/bold cyan]\\n"
        "• VPN can hide destination IPs/domains from local Wi-Fi in many circumstances, but router still sees VPN endpoint, timing, and volume.\\n"
        "• HTTPS protects page contents; DNS encryption protects DNS queries only when actually routed through encrypted DNS.\\n"
        "• Android per-network randomized MAC is configured in Wi-Fi settings, not changed by this non-root script.\\n"
        "• Private DNS (DoT) is configured in Android settings; Termux cannot force system-wide DNS.\\n"
        "• No tool can guarantee invisibility or erase router/ISP logs.\\n"
        "• Use only networks you are authorized to access.",
        border_style="yellow"))

def about():
    console.print(Panel("[bold cyan]ANPS V1.0[/bold cyan]\\nAndroid Network Privacy System\\n\\n[bold bright_blue]CODE BY NCODE[/bold bright_blue]\\n© NCODE — Network Privacy Project",
                       title="ABOUT",border_style="cyan"))

def main():
    while True:
        banner(); console.print(menu())
        choice=Prompt.ask(" [bold cyan]ANPS[/bold cyan] / Select",choices=["01","02","03","04","05","06","07","08","00"],default="01")
        console.print()
        try:
            if choice=="01": dashboard()
            elif choice=="02": show_ip()
            elif choice=="03": show_dns()
            elif choice=="04": show_vpn()
            elif choice=="05": show_network()
            elif choice=="06":
                for name,status,detail in run_audit(): 
                    console.print(f"[cyan]{name}[/cyan]  {status}  {detail}")
            elif choice=="07": notes()
            elif choice=="08": about()
            elif choice=="00": console.print("[cyan]ANPS • CODE BY NCODE — Goodbye.[/cyan]"); break
        except KeyboardInterrupt:
            console.print("\\n[yellow]Cancelled.[/yellow]")
        except Exception as e:
            console.print(f"[red]Error: {e}[/red]")
        if choice!="00": Prompt.ask("\\nPress Enter to return",default="")
if __name__=="__main__": main()
