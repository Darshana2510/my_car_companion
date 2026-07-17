import { Injectable } from "@nitrostack/core";
import { google } from "googleapis";

@Injectable()
export class CalendarService {
    private calendar;

    constructor() {
        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        auth.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        this.calendar = google.calendar({
            version: "v3",
            auth
        });
    }

    async createEvent(input: {
        title: string;
        description?: string;
        start: string;
        end: string;
        location?: string;
    }) {
        const response = await this.calendar.events.insert({
            calendarId: "primary",
            requestBody: {
                summary: input.title,
                description: input.description,
                start: {
                    dateTime: input.start
                },
                end: {
                    dateTime: input.end
                },
                location: input.location
            }
        });

        return {
            eventId: response.data.id,
            htmlLink: response.data.htmlLink,
            start: response.data.start?.dateTime,
            end: response.data.end?.dateTime
        };
    }

    async deleteEvent(eventId: string) {
        await this.calendar.events.delete({
            calendarId: "primary",
            eventId
        });

        return {
            success: true
        };
    }
}