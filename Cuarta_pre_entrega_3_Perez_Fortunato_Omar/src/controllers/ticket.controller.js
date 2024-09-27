import * as ticketService from "../services/ticket.services.js";
import { HttpResponse } from "../utils/http.response.js";
const httpResponse = new HttpResponse()


export const generateTicket = async (req, res, next) => {
        try {
            const user = req.user;
            const ticket = await ticketService.generateTicket(user);
            if (!ticket) httpResponse.BadRequest(res,ticket);
            else {
                console.log(ticket)
                return httpResponse.Ok(res, ticket);
            }
        } catch (error) {
            next(error);
    }
}
