

import * as cartService from "./cart.services.js";
import * as productService from "./product.services.js";

import TicketDaoMongo from "../persistence/daos/mongodb/ticket.dao.js";
const ticketDao= new TicketDaoMongo()


  
        export const generateTicket = async (user) => {
            try {
            const cart = await cartService.getById(user.cid);
            if (!cart) return null;

            let amountAcc = 0;
            if (cart.products.length > 0) {
                for (const x of cart.products) {
                    const idProd = x.product._id;//tuve que agregaar el id porq el cart tien el populate
                    const prodDB = await productService.getById(idProd);
                

                    if (x.quantity <= prodDB.stock) {
                        const amount = x.quantity * prodDB.price;
                        amountAcc += amount;
                    } else return null;
                }
            }

            const ticket = await ticketDao.create({
                code: `${Math.floor(Math.random() * 1000)}`,
                purchase_datetime: new Date().toLocaleString(),
                amount: amountAcc,
                purchaser: user.email,
            });

            await cartService.clearCart(user.cid);

            return ticket;

        } catch (error) {
            throw new Error(error);
        }
    }
