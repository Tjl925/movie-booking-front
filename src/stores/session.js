import { defineStore } from 'pinia'

export const useSessionStore = defineStore('session', {
    state: () => ({
        currentSession: null
    }),
    actions: {
        setCurrentSession(session) {
            this.currentSession = session
        }
    }
})