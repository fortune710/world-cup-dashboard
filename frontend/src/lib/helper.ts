export function getMatchWinner(homeScore: number, awayScore: number):string {
    if (homeScore > awayScore) {
        return "home";
    } else if (homeScore < awayScore) {
        return "away";
    } else {
        return "draw";
    }
}