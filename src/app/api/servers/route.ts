import { NextResponse } from 'next/server';

const API_URL = 'https://codservers.net/cod1_servers.json';
let cache: { data: any; time: number } | null = null;
const CACHE_TTL = 15000; // 15 seconds

export async function GET() {
  try {
    // Serve from cache if fresh
    if (cache && Date.now() - cache.time < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    const res = await fetch(API_URL, {
      next: { revalidate: 0 },
      headers: {
        'User-Agent': 'Nxr4-Dashboard/1.0',
      },
    });

    if (!res.ok) {
      throw new Error(`API returned ${res.status}`);
    }

    const json = await res.json();

    // Filter Nxr4 servers
    const nxr4Servers = (json.servers || [])
      .filter((s: any) => s.hostname && s.hostname.includes('Nxr4'))
      .map((s: any) => {
        // Clean hostname from color codes and control chars
        const cleanName = (s.hostname || '')
          .replace(/[\x00-\x1f]/g, '')
          .replace(/\^\d/g, '')
          .trim();

        // Extract server label (e.g., "S&D", "UAE", "Test", "FW")
        const labelMatch = cleanName.match(/\|\|(.+?)(?:\*?\s*)$/);
        const label = labelMatch ? labelMatch[1].trim() : 'Server';

        // Extract location from raw_info
        const rawInfo = s.raw_info || {};
        const location = rawInfo['^5location'] || rawInfo['location'] || s.country?.toUpperCase() || 'Unknown';
        const discord = rawInfo['^1discord'] || '';
        const owner = rawInfo['^1owner'] || '';
        const website = rawInfo['^1website'] || '';

        // Clean player names
        const players = (s.players || []).map((p: any) => ({
          name: (p.name || '').replace(/\^\d/g, '').trim(),
          score: p.score || 0,
          ping: p.ping || 0,
        })).sort((a: any, b: any) => b.score - a.score);

        // Password check
        const hasPassword = rawInfo['pswrd'] === '1';

        // Game type uppercase
        const gametype = (s.gametype || '').toUpperCase();

        // Map name
        const map = (s.map || 'unknown').toLowerCase();

        // Response time
        const responseTime = Math.round((s.response_time || 0) * 1000);

        return {
          name: cleanName,
          label,
          ip: s.ip,
          port: s.port,
          country: s.country?.toUpperCase() || '??',
          location: location.replace(/\^\d/g, '').trim(),
          map,
          gametype,
          maxplayers: s.maxplayers || 0,
          playerCount: players.length,
          players,
          hasPassword,
          version: s.version || '1.1',
          owner: owner.replace(/\^\d/g, '').trim(),
          discord: discord.replace(/\^\d/g, '').trim(),
          website: website.replace(/\^\d/g, '').trim(),
          responseTime,
          lastUpdated: s.last_updated,
          isOnline: true,
        };
      });

    const totalPlayers = nxr4Servers.reduce((sum: number, s: any) => sum + s.playerCount, 0);

    const result = {
      game: json.game,
      masterOnline: json.master_online,
      totalServers: json.server_count,
      nxr4Count: nxr4Servers.length,
      totalNxr4Players: totalPlayers,
      servers: nxr4Servers,
      fetchedAt: new Date().toISOString(),
    };

    cache = { data: result, time: Date.now() };
    return NextResponse.json(result);
  } catch (error: any) {
    // Return cached data even if stale, on error return empty
    if (cache) {
      return NextResponse.json(cache.data);
    }
    return NextResponse.json(
      { error: 'Failed to fetch server data', servers: [], fetchedAt: new Date().toISOString() },
      { status: 500 }
    );
  }
}
