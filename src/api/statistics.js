import request from "@/utils/request";

export const analyzeMovie = () => request.get('/api/movies/analyze-movie');
export const analyzeSession = () => request.get('/api/sessions/analyze-session');
export const analyzeSessionBoxOffice = () => request.get('/api/sessions/analyze-session-box-office');