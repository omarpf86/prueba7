
import { UserModel } from "./models/user.model.js";


export default class UserDaoMongoDB {
   

    async getUser(email) {
        try {
            const user = await UserModel.findOne({ email})
            return user;
            }catch (error) {
            throw new Error(error);
        }
    }

    async getUserById(id) {
        try {
            const user = await UserModel.findOne({ _id: id }).populate("cart") 
            return user;
        } catch (error) {
            throw new Error(error);
        }
    }

    async getAll() {
        try {
            const response = await UserModel.find({});
            return response;
        } catch (error) { throw new Error(error) }

    }


    async register(user) {
        try {
            const response = await UserModel.create(user); 
            return response;
        } catch (error) { throw new Error("Error in user creation") }
    }


    async login(email) {
        try {
            const response = await UserModel.findOne({ email }); 
            return response
        } catch (error) {
            throw new Error(error)
        }
    }

    async deleteUser(id) {
        try {
            const response = await UserModel.findByIdAndDelete(id);
            return response;
        } catch (error) {
            throw new Error(error);
        }
    }

    async update(id, obj) {
        try {
            const response = await UserModel.findByIdAndUpdate(id, obj, {
                new: true,
            });
            return response;
        } catch (error) {
            console.log(error);
        }
    }


    async findUsers(now) {
        try {
            const response = await UserModel.find({ lastConnection: { $lt: now } })
            return response;
        } catch (error) {
            throw new Error(error);
        }
    }

    async deleteInactiveUsers(users) {
        try {
            const deleteUsers =  users.map(x => UserModel.findByIdAndDelete(x._id))
            const response = await Promise.all(deleteUsers)
            return response;
        } catch (error) {
            throw new Error(error);
        }
    }



}    



/*  
    users.map(x => UserModel.findByIdAndDelete(x._id)): Esto crea un array de promesas. El método map() no espera a que estas promesas se resuelvan, simplemente crea y devuelve el array de promesas.

    await users.map(x => UserModel.findByIdAndDelete(x._id)): Usar await aquí no esperará que las promesas dentro del array se resuelvan. En su lugar, lo que obtienes es una promesa de un array de promesas, lo cual no es útil porque await solo resuelve la promesa principal, no las internas.

Manejo Correcto de Promesas

Para manejar correctamente la eliminación de múltiples documentos, necesitas asegurarte de que todas las promesas se resuelvan antes de continuar. Para esto, debes usar Promise.all(), que toma un array de promesas y devuelve una nueva promesa que se resuelve cuando todas las promesas en el array se han completado.

Aquí está el código correcto para manejar la eliminación de usuarios:

javascript

async deleteInactiveUsers(users) {
    try {
        // Asegúrate de que `users` sea un array válido.
        if (!Array.isArray(users) || users.length === 0) {
            return []; // Retorna un array vacío si no hay usuarios para eliminar.
        }
        
        // Crea un array de promesas para eliminar los usuarios.
        const deletePromises = users.map(user => UserModel.findByIdAndDelete(user._id));
        
        // Usa Promise.all() para esperar a que todas las promesas se resuelvan.
        const response = await Promise.all(deletePromises);
        
        return response; // Retorna los documentos eliminados.
    } catch (error) {
        console.error("Error in deleteInactiveUsers DAO:", error);
        throw new Error("Failed to delete inactive users from the database");
    }
}

Resumen:

    map(): Genera un array de promesas pero no espera a que se completen.
    Promise.all(): Espera a que todas las promesas en el array se resuelvan antes de continuar.

Usar Promise.all() asegura que deleteInactiveUsers no solo genere las promesas, sino que también espere a que todas se completen antes de devolver el resultado.








*/