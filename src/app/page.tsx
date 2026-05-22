'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Activity,
  Globe,
  Lock,
  Map,
  Monitor,
  Users,
  RefreshCw,
  Server,
  Shield,
  Timer,
  User,
  Wifi,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============ Types ============
interface Player {
  name: string;
  score: number;
  ping: number;
}

interface NxServer {
  name: string;
  label: string;
  ip: string;
  port: number;
  country: string;
  location: string;
  map: string;
  gametype: string;
  maxplayers: number;
  playerCount: number;
  players: Player[];
  hasPassword: boolean;
  version: string;
  owner: string;
  discord: string;
  website: string;
  responseTime: number;
  lastUpdated: string;
  isOnline: boolean;
}

interface ServerData {
  game: string;
  masterOnline: boolean;
  totalServers: number;
  nxr4Count: number;
  totalNxr4Players: number;
  servers: NxServer[];
  fetchedAt: string;
}

// ============ Helpers ============
function cleanColor(text: string) {
  return text.replace(/\^\d/g, '');
}

function getCountryFlag(country: string) {
  const flags: Record<string, string> = {
    US: '🇺🇸', IN: '🇮🇳', AE: '🇦🇪', DE: '🇩🇪', GB: '🇬🇧',
    FR: '🇫🇷', NL: '🇳🇱', RU: '🇷🇺', PK: '🇵🇰', BR: '🇧🇷',
    SA: '🇸🇦', TR: '🇹🇷', PL: '🇵🇱', HU: '🇭🇺', RO: '🇷🇴',
    CZ: '🇨🇿', ES: '🇪🇸', IT: '🇮🇹', AU: '🇦🇺', JP: '🇯🇵',
  };
  return flags[country.toUpperCase()] || '🌍';
}

function getGametypeColor(gametype: string) {
  const colors: Record<string, string> = {
    SD: 'bg-red-500/20 text-red-400 border-red-500/30',
    TDM: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    DM: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    CTF: 'bg-green-500/20 text-green-400 border-green-500/30',
    HQ: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    RE: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };
  return colors[gametype.toUpperCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

function getPingColor(ping: number) {
  if (ping < 50) return 'text-green-400';
  if (ping < 100) return 'text-yellow-400';
  if (ping < 200) return 'text-orange-400';
  return 'text-red-400';
}

function getLabelColor(label: string) {
  const colors: Record<string, string> = {
    'S&D': 'text-red-400',
    'UAE': 'text-amber-400',
    'TEST': 'text-gray-400',
    'FW': 'text-cyan-400',
  };
  const key = label.toUpperCase();
  for (const [k, v] of Object.entries(colors)) {
    if (key.includes(k)) return v;
  }
  return 'text-purple-400';
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

// ============ Copy Button ============
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-white/10 transition-colors text-gray-500 hover:text-gray-300"
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? 'Copied!' : 'Copy IP:Port'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============ Player Table ============
function PlayerTable({ players, maxplayers }: { players: Player[]; maxplayers: number }) {
  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-gray-500">
        <User className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-sm">No players online</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            <th className="text-left py-2 px-3 text-gray-400 font-medium">#</th>
            <th className="text-left py-2 px-3 text-gray-400 font-medium">Player</th>
            <th className="text-right py-2 px-3 text-gray-400 font-medium">Score</th>
            <th className="text-right py-2 px-3 text-gray-400 font-medium">Ping</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr
              key={i}
              className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-1.5 px-3 text-gray-500">{i + 1}</td>
              <td className="py-1.5 px-3 text-gray-200 font-medium truncate max-w-[140px]">
                {p.name || 'Unknown'}
              </td>
              <td className="py-1.5 px-3 text-right text-yellow-400 font-mono font-bold">
                {p.score}
              </td>
              <td className={`py-1.5 px-3 text-right font-mono ${getPingColor(p.ping)}`}>
                {p.ping}ms
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============ Server Card ============
function ServerCard({ server, index }: { server: NxServer; index: number }) {
  const fillPercent = Math.round((server.playerCount / server.maxplayers) * 100);
  const fillColor = fillPercent >= 80 ? 'bg-red-500' : fillPercent >= 50 ? 'bg-amber-500' : fillPercent > 0 ? 'bg-green-500' : 'bg-gray-600';

  return (
    <Card className="relative overflow-hidden border-white/[0.06] bg-gradient-to-br from-[#0c1222]/90 to-[#111827]/90 backdrop-blur-xl shadow-2xl shadow-black/40 hover:border-white/[0.12] transition-all duration-500 group">
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${
            server.playerCount > 0 ? '#ef4444' : '#374151'
          } 0%, ${
            server.playerCount > 0 ? '#f97316' : '#1f2937'
          } 50%, ${
            server.playerCount > 0 ? '#22c55e' : '#111827'
          } 100%)`,
        }}
      />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Server Name + Location */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">{getCountryFlag(server.country)}</span>
                <Badge
                  variant="outline"
                  className={`font-bold text-xs border ${getGametypeColor(server.gametype)}`}
                >
                  {server.gametype}
                </Badge>
                {server.hasPassword && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                      </TooltipTrigger>
                      <TooltipContent>Password Protected</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            <CardTitle className="text-white text-base leading-tight truncate">
              <span className={getLabelColor(server.label)}>
                Nxr4
              </span>
              <span className="text-gray-500"> || </span>
              <span className="text-gray-200">{server.label}</span>
            </CardTitle>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Globe className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-400">{server.location}</span>
              <span className="text-gray-600 mx-1">|</span>
              <Map className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-400 uppercase">{server.map}</span>
            </div>
          </div>

          {/* Player Count Circle */}
          <div className="relative flex-shrink-0">
            <div className={`
              w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center
              ${server.playerCount > 0
                ? 'border-green-500/40 bg-green-500/10'
                : 'border-gray-600/40 bg-gray-700/10'
              }
              transition-all duration-300
            `}>
              <span className={`text-xl font-black font-mono leading-none ${
                server.playerCount > 0 ? 'text-green-400' : 'text-gray-500'
              }`}>
                {server.playerCount}
              </span>
              <span className="text-[10px] text-gray-500 leading-none">/{server.maxplayers}</span>
            </div>
            {/* Online dot */}
            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#0f172a] animate-pulse" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Player Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Players</span>
            <span>{fillPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${fillColor} transition-all duration-700 ease-out`}
              style={{ width: `${Math.min(fillPercent, 100)}%` }}
            />
          </div>
        </div>

        <Separator className="bg-white/5" />

        {/* IP + Quick Info */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-gray-400 bg-white/5 px-2 py-1 rounded font-mono">
              <span>{server.ip}</span>
              <span className="text-gray-600">:</span>
              <span>{server.port}</span>
              <CopyButton text={`${server.ip}:${server.port}`} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span className="flex items-center gap-1">
              <Timer className="w-3 h-3" />
              {server.responseTime}ms
            </span>
          </div>
        </div>

        {/* Player Table */}
        {server.players.length > 0 && (
          <PlayerTable players={server.players} maxplayers={server.maxplayers} />
        )}

        {/* Footer Info */}
        <div className="flex items-center justify-between text-[10px] text-gray-600 pt-1">
          <span className="flex items-center gap-1">
            <Monitor className="w-3 h-3" />
            CoD {server.version} | CoDExtended
          </span>
          <span>v{index + 1}.0</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============ Main Page ============
export default function Dashboard() {
  const [data, setData] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(15);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/servers');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setError(null);
      setLastRefresh(new Date());
      setCountdown(15);
    } catch (err: any) {
      setError('Failed to fetch server data. Retrying...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchData();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  // Quick link
  const discordLink = data?.servers?.find(s => s.discord)?.discord || '';

  return (
    <div className="min-h-screen bg-[#080d19] text-white">
      {/* Animated background grid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-500/[0.07] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/[0.05] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-green-500/[0.04] rounded-full blur-[150px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/[0.06] bg-black/30 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-red-500/20">
                    Nx
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#080d19]" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight">
                    <span className="text-white">Nxr4</span>
                    <span className="text-gray-500 mx-1.5">|</span>
                    <span className="text-red-400">Server</span>
                    <span className="text-gray-300"> Dashboard</span>
                  </h1>
                  <p className="text-[11px] text-gray-500 -mt-0.5">Call of Duty 1.1 - Real-time Monitor</p>
                </div>
              </div>

              {/* Header Stats */}
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs bg-white/5 px-3 py-1.5 rounded-lg">
                  <Wifi className={`w-3.5 h-3.5 ${data?.masterOnline ? 'text-green-400' : 'text-red-400'}`} />
                  <span className="text-gray-400">
                    Master: <span className={data?.masterOnline ? 'text-green-400' : 'text-red-400'}>
                      {data?.masterOnline ? 'Online' : 'Offline'}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs bg-white/5 px-3 py-1.5 rounded-lg">
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-gray-400">
                    Total Server in CoD1: <span className="text-white font-bold">{data?.totalServers || 0}</span> servers
                  </span>
                </div>
              </div>

              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchData}
                className="text-gray-400 hover:text-white hover:bg-white/10 gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-xs hidden sm:inline">{countdown}s</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Stats Bar */}
        <div className="border-b border-white/[0.04] bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center gap-6 sm:gap-10 overflow-x-auto">
              <StatItem
                icon={<Shield className="w-4 h-4 text-red-400" />}
                label="Nxr4 Servers"
                value={String(data?.nxr4Count ?? '...')}
                color="text-red-400"
              />
              <StatItem
                icon={<Users className="w-4 h-4 text-green-400" />}
                label="Total Players"
                value={String(data?.totalNxr4Players ?? '...')}
                color="text-green-400"
              />
              <StatItem
                icon={<Globe className="w-4 h-4 text-blue-400" />}
                label="Locations"
                value={data?.servers ? String([...new Set(data.servers.map(s => s.location))].length) : '...'}
                color="text-blue-400"
              />
              <StatItem
                icon={<Activity className="w-4 h-4 text-amber-400" />}
                label="Status"
                value={data?.masterOnline ? 'All Online' : 'Issues'}
                color={data?.masterOnline ? 'text-green-400' : 'text-red-400'}
              />
              <StatItem
                icon={<Timer className="w-4 h-4 text-gray-400" />}
                label="Updated"
                value={lastRefresh ? timeAgo(lastRefresh.toISOString()) : '...'}
                color="text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Server Grid */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && !data && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-[#0c1222]/80 p-5">
                  <Skeleton className="h-5 w-48 mb-3 bg-white/10" />
                  <Skeleton className="h-4 w-32 mb-5 bg-white/10" />
                  <Skeleton className="h-2 w-full mb-4 bg-white/10" />
                  <Skeleton className="h-4 w-40 bg-white/10" />
                </div>
              ))}
            </div>
          )}

          {/* Server Cards */}
          {data && (
            <>
              {data.servers.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <Server className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium">No Nxr4 servers found</p>
                  <p className="text-sm mt-1">Servers may be offline or not responding</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {data.servers.map((server, i) => (
                    <ServerCard key={`${server.ip}-${server.port}`} server={server} index={i} />
                  ))}
                </div>
              )}

              {/* All Players List */}
              {data.servers.some(s => s.players.length > 0) && (
                <Card className="mt-6 border-white/[0.06] bg-[#0c1222]/80 backdrop-blur-xl overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      All Online Players Across Servers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="max-h-64">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.servers.map(server =>
                          server.players.map((p, i) => (
                            <div
                              key={`${server.ip}-${i}`}
                              className="flex items-center justify-between bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.04]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm">{getCountryFlag(server.country)}</span>
                                <span className="text-sm text-gray-200 truncate">{p.name}</span>
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-xs text-gray-500">{server.label}</span>
                                <span className={`text-xs font-mono ${getPingColor(p.ping)}`}>{p.ping}ms</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Footer */}
              <div className="mt-8 text-center text-xs text-gray-600 space-y-1">
                <p>
                  Data from{' '}
                  <a
                    href="https://COD.PM"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    codservers.net <ExternalLink className="w-3 h-3" />
                  </a>
                  {discordLink && (
                    <>
                      <span className="mx-2 text-gray-700">|</span>
                      <a
                        href={discordLink.startsWith('http') ? discordLink : `https://${discord.gg/nxra}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
                      >
                        Discord <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </p>
                <p>Nxr4 Gaming Community | Auto-refreshing every 15s</p>
                {data.fetchedAt && (
                  <p className="text-gray-700">Last fetch: {new Date(data.fetchedAt).toLocaleString()}</p>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ============ Stat Item ============
function StatItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      {icon}
      <div>
        <p className="text-[10px] text-gray-500 leading-none">{label}</p>
        <p className={`text-sm font-bold font-mono leading-tight ${color}`}>{value}</p>
      </div>
    </div>
  );
}
