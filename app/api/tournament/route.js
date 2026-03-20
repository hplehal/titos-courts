// app/api/tournament/route.js
import prisma from "../../../lib/prisma";
import { NextResponse } from "next/server";

const TOURNAMENT_ID = "current";

// Default teams if no tournament exists yet
const DEFAULT_TEAMS = {
  A: ["Set Me Daddy", "Big Juicy Biceps", "Tacos and Timbits", "Block Obama"],
  B: ["Block It Like It's Hot", "Lib'idos", "Dark Soy Sauce", "Linglit"],
  C: ["Hakuna Matata", "Outlaws", "OLLIEB's Fan Club", "Spike Wazowski"],
  D: ["Block Choy", "OTeddies", "Block Block", "Vito's League"],
};

const POOLS = ["A", "B", "C", "D"];
const RR = [[0,2],[1,3],[0,3],[1,2],[2,3],[0,1]];

function initScores() {
  const s = {};
  POOLS.forEach(p => {
    s[p] = RR.map(m => ({ t1: m[0], t2: m[1], sets: [{ s1: "", s2: "" }, { s1: "", s2: "" }] }));
  });
  return s;
}

// GET - Load tournament data
export async function GET() {
  try {
    let tournament = await prisma.tournament.findUnique({
      where: { id: TOURNAMENT_ID },
    });

    if (!tournament) {
      // Create default tournament
      tournament = await prisma.tournament.create({
        data: {
          id: TOURNAMENT_ID,
          teams: DEFAULT_TEAMS,
          scores: initScores(),
          playoffScores: {},
          started: false,
        },
      });
    }

    return NextResponse.json({
      teams: tournament.teams,
      scores: tournament.scores,
      playoffScores: tournament.playoffScores,
      started: tournament.started,
    });
  } catch (error) {
    console.error("GET /api/tournament error:", error);
    return NextResponse.json({ error: "Failed to load tournament" }, { status: 500 });
  }
}

// POST - Save tournament data
export async function POST(request) {
  try {
    const body = await request.json();
    const { teams, scores, playoffScores, started } = body;

    const tournament = await prisma.tournament.upsert({
      where: { id: TOURNAMENT_ID },
      update: {
        teams: teams,
        scores: scores,
        playoffScores: playoffScores ?? {},
        started: started ?? false,
      },
      create: {
        id: TOURNAMENT_ID,
        teams: teams,
        scores: scores,
        playoffScores: playoffScores ?? {},
        started: started ?? false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/tournament error:", error);
    return NextResponse.json({ error: "Failed to save tournament" }, { status: 500 });
  }
}

// DELETE - Reset tournament
export async function DELETE() {
  try {
    await prisma.tournament.upsert({
      where: { id: TOURNAMENT_ID },
      update: {
        teams: DEFAULT_TEAMS,
        scores: initScores(),
        playoffScores: {},
        started: false,
      },
      create: {
        id: TOURNAMENT_ID,
        teams: DEFAULT_TEAMS,
        scores: initScores(),
        playoffScores: {},
        started: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/tournament error:", error);
    return NextResponse.json({ error: "Failed to reset tournament" }, { status: 500 });
  }
}