import request from "@/utils/request";

export const analyzeMovie = () => request.get('/api/movies/analyze-movie');
export const analyzeSession = () => request.get('/api/sessions/analyze-session');
export const analyzeSessionBoxOffice = () => request.get('/api/sessions/analyze-session-box-office');
export const analyzeWeekBoxOffice = () => request.get('/api/sessions/analyze-week-box-office');
export const analyzeGenreBoxOffice = () => request.get('/api/movies/analyze-genre-box-office');
export const analyzeRegionBoxOffice = () => request.get('/api/movies/analyze-region-box-office');