
import { createHash,isValidPassword } from "../utils.js";
import persistence from "../persistence/daos/factory.js";
const { userDao } = persistence;
import UserRepository from '../persistence/repository/user.repository.js';
import { sendGmail } from "./email.service.js";
const userRepository = new UserRepository();

const { cartDao } = persistence;

export const getUser = async (email) => {
    try {
        const user = await userDao.getUser(email);
        return user
    } catch (error) {
        throw new Error(error);
    }
};

export const getUserById = async (id) => {
    try {
        const user = await userRepository.getById(id)
        return user
    } catch (error) {
        throw new Error(error);
    }
};

export const getAll = async () => {
    try {
        const user = await userRepository.getAll();
        return user
    } catch (error) {
        throw new Error(error);
    }
};




export const register = async (user) => {
    try {
        const { email, password, isGithub } = user
        const cartUser = await cartDao.create();
        if (email === 'adminCoder@mail.com' && password === 'adminCoder123')
        {
            const newUser = await userDao.register({ ...user, password: createHash(password), role: 'admin', cart: cartUser._id })
               return newUser      
        } else {
               if (!isGithub) {
                   const newUserC = await userDao.register({ ...user, password: createHash(password), cart: cartUser._id})
                return newUserC
                }
                else { 
                   const newUserD = await userDao.register({ ...user, cart: cartUser._id })
                   return newUserD 
                    }
            }   
    } catch (error) {
        throw new Error(error.message);
    }
};


export const login = async (obj) => {
    try {
        const {email, password} = obj;
        const user = await userDao.login(email);
        if (isValidPassword(password, user)) {
            return user
        }else return null
    } catch (error) {
        throw new Error(error);
    }
};

export const deleteUser = async (id) => {
    try {
        return await userDao.deleteUser(id);
    } catch (error) {
        throw new Error(error);
    }
};

export const update = async (id, role) => {
    try {

        return await userDao.update(id, { role });
    } catch (error) {
        throw new Error(error);
    }
};



export const showInactiveUsers = async () => {
    try {
        const now = new Date();
        now.setMinutes(now.getMinutes() - 5);
        const users = await userDao.findUsers(now)
        return users
    } catch (error) {
        throw new Error(error);
    }
}

export const deleteInactiveUsers = async () => {
    try {
        const users = await showInactiveUsers()
        const deleteUsers = await userDao.deleteInactiveUsers(users)
        if (deleteUsers) {
            const emailPromises = deleteUsers.map(async (x) => {
                let first_name = x.first_name;
                let email = x.email;
                let id= ""
                return sendGmail(first_name, email,id, 'deleteUsers'); 
            });
            await Promise.all(emailPromises); // Espera a que todas las promesas se resuelvan en paralelo  
        }
        return deleteUsers
    } catch (error) {
        throw new Error(error);
    }
}

/* 

export const deleteInactiveUsers = async () => {
    try {
        const users = await showInactiveUsers();
        const deleteUsers = await userDao.deleteInactiveUsers(users);
        if (deleteUsers) {
            const emailPromises = deleteUsers.map(async (x) => {
                let first_name = x.first_name;
                let email = x.email;
                return sendGmail(first_name, email, 'deleteUsers');
            });
            await Promise.all(emailPromises); // Enviar correos en paralelo
        }
        return deleteUsers;
    } catch (error) {
        throw new Error(error);
    }
};

Las dos versiones de tu función deleteInactiveUsers hacen lo mismo en esencia: eliminar usuarios inactivos y luego enviar un correo electrónico a cada usuario eliminado. Sin embargo, la diferencia principal está en cómo se gestionan las operaciones asincrónicas dentro del bucle. Aquí te explico la diferencia entre ambas versiones:
Primera versión: for...of con await dentro del bucle

javascript

export const deleteInactiveUsers = async () => {
    try {
        const users = await showInactiveUsers();
        const deleteUsers = await userDao.deleteInactiveUsers(users);
        if (deleteUsers) {
            for (const x of deleteUsers) {
                let first_name = x.first_name;
                let email = x.email;
                console.log("en user service", first_name, email);
                await sendGmail(first_name, email, 'deleteUsers'); // Espera a que se envíe cada email
            }   
        }
        return deleteUsers;
    } catch (error) {
        throw new Error(error);
    }
};

Características de esta versión:

    Secuencial: Dentro del bucle for...of, utilizas await para esperar a que cada llamada a sendGmail() se complete antes de pasar a la siguiente iteración.
    Lento: Debido a que esperas a que cada correo electrónico se envíe uno tras otro, el tiempo total que tarda el proceso es la suma del tiempo de todas las llamadas a sendGmail(). Esto puede ser ineficiente, especialmente si tienes muchos usuarios, ya que envías un correo tras otro, de manera secuencial.

Ejemplo:

Si tienes 10 usuarios y cada correo tarda 1 segundo en enviarse, la función tardará al menos 10 segundos en completarse.
Segunda versión: map con Promise.all para paralelizar

javascript

export const deleteInactiveUsers = async () => {
    try {
        const users = await showInactiveUsers();
        const deleteUsers = await userDao.deleteInactiveUsers(users);
        if (deleteUsers) {
            const emailPromises = deleteUsers.map(async (x) => {
                let first_name = x.first_name;
                let email = x.email;
                return sendGmail(first_name, email, 'deleteUsers'); // Retorna la promesa
            });
            await Promise.all(emailPromises); // Espera a que todas las promesas se resuelvan en paralelo
        }
        return deleteUsers;
    } catch (error) {
        throw new Error(error);
    }
};

Características de esta versión:

    Paralelo: En lugar de esperar a que cada correo se envíe de forma secuencial, esta versión genera una promesa para cada usuario y luego usa Promise.all() para esperar a que todas las promesas se resuelvan en paralelo.
    Más rápido: Como todas las llamadas a sendGmail() se ejecutan en paralelo, el tiempo total que toma el proceso será aproximadamente el tiempo que tarde en completarse el correo más lento. Esto es mucho más eficiente si tienes muchos usuarios.

Ejemplo:

Con 10 usuarios y cada correo tardando 1 segundo en enviarse, la función ahora solo tardará alrededor de 1 segundo (dependiendo del tiempo de la llamada más lenta), ya que todas las llamadas se hacen en paralelo.
Diferencia clave:

    Primera versión (secuencial): Espera que cada correo sea enviado antes de enviar el siguiente, lo que puede ser lento si tienes muchos usuarios.
    Segunda versión (paralelo): Envía todos los correos electrónicos al mismo tiempo, lo que hace el proceso mucho más rápido.

¿Cuál es mejor?

    Para casos con pocos usuarios: La primera versión podría funcionar bien si solo tienes que enviar unos pocos correos, ya que la complejidad es menor.
    Para casos con muchos usuarios: La segunda versión es más eficiente y recomendable, ya que reduce significativamente el tiempo total de ejecución al enviar los correos en paralelo.

En resumen, si quieres que el proceso de envío de correos sea más rápido y eficiente, la segunda versión es la mejor opción debido a su ejecución en paralelo.

ChatGPT puede co


*/




/* 
Términos y Componentes:

    const inactiveUsers:
        const: Es una palabra clave de JavaScript que declara una variable cuyo valor no puede ser reasignado. Aquí se está creando una constante llamada inactiveUsers.
        inactiveUsers: Es el nombre de la constante que almacenará el resultado de la operación.

    await:
        await: Es una palabra clave de JavaScript que se usa dentro de funciones async para esperar a que una Promesa se resuelva. Suspende la ejecución de la función async hasta que la Promesa devuelta por userDao.find() se resuelva, y luego asigna el resultado a inactiveUsers.

    userDao.find(...):
        userDao: Es una instancia o objeto que interactúa con la base de datos. En este contexto, userDao es un objeto que probablemente contiene métodos para realizar operaciones en la colección de usuarios de MongoDB.
        find(...): Es un método de Mongoose para buscar documentos en una colección que coincidan con ciertos criterios. Devuelve una Promesa que se resuelve con los documentos que coinciden.

    { lastConnection: { $lt: twoDaysAgo } }:
        { lastConnection: { $lt: twoDaysAgo } }: Es un objeto que define los criterios de búsqueda para el método find(). En este caso, busca documentos en los que el campo lastConnection sea menor que ($lt) la fecha y hora almacenadas en la variable twoDaysAgo.
            lastConnection: Es el nombre del campo en el esquema de usuario que almacena la última vez que el usuario se conectó.
            $lt: Es un operador de comparación en MongoDB que significa "menor que". Se usa para filtrar documentos donde el valor del campo es menor que el valor especificado.
            twoDaysAgo: Es una variable que contiene una fecha y hora que representa el punto en el tiempo 48 horas antes del momento actual. Se utiliza para encontrar usuarios cuya última conexión fue antes de esa fecha y hora.



*/