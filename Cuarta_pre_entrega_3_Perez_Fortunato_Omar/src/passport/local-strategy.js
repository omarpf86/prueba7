import * as services from '../services/user.services.js';
import passport from "passport";
import { Strategy as LocalStrategy } from 'passport-local';
import { logger } from '../utils/logger.js'

const strategyConfig = {
    usernameField: 'email',
    passportField: 'password',
    passReqToCallback: true
};

const signUp = async (req, email, password, done) => {
    try {
        const user = await services.getUser(email);
        if (user) return done(null, false);
        const newUser = await services.register(req.body);
        return done(null, newUser);
    } catch (error) {
        console.log(error);
        return done(error);
    }
};

const login = async (req, email, password, done) => {
    try {
        const userLogin = await services.login({email, password} ); 
        if (!userLogin) {
            req.session.destroy()
            return done(null, false, { message: 'Alto ahí Rufián ⛔' });
        }
       userLogin.lastConnection = new Date();
       await userLogin.save();
        return done(null, userLogin)
    } catch (error) {
        console.log(error)
        return done(error)
    }
};

const signUpStrategy = new LocalStrategy(strategyConfig, signUp);
const loginStrategy = new LocalStrategy(strategyConfig, login);

passport.use('register', signUpStrategy);
passport.use('login', loginStrategy);

passport.serializeUser((user, done) => {
    done(null, user._id)
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await services.getUserById(id);
        logger.info("from local-strategy.js, la deserialización se lleva a cabo" , user)
        return done(null, user);
    } catch (error) {
        done(error)
    }
});


/* 
El hecho de que la línea await userLogin.save(); funcione y actualice el valor de lastConnection en la base de datos de MongoDB, incluso sin importar explícitamente mongoose en el archivo local-strategy.js, se debe a la estructura de tu aplicación y cómo estás organizando el acceso a la base de datos.
¿Por qué funciona sin importar mongoose en local-strategy.js?

    Servicios (user.services.js): Estás utilizando un archivo llamado user.services.js para manejar las operaciones relacionadas con el usuario, como getUser, register, y login. Estas funciones probablemente se encargan de interactuar con Mongoose y la base de datos. El archivo local-strategy.js no necesita importar mongoose directamente, ya que utiliza las funciones del servicio (services.login()) para obtener el modelo UserModel ya conectado con Mongoose.

    En otras palabras, el archivo local-strategy.js no está directamente manejando la conexión a la base de datos. En cambio, lo hace a través de los servicios, que probablemente son responsables de interactuar con el modelo de Mongoose.

    Mongoose y el modelo de usuario: Cuando obtienes userLogin a través de services.login(), es probable que userLogin sea una instancia de un documento Mongoose. Dado que Mongoose ya está importado y configurado en otros lugares (posiblemente en user.services.js o User.model.js), no necesitas volver a importar Mongoose en local-strategy.js.

    Por lo tanto, cuando haces:

    js

    userLogin.lastConnection = new Date();
    await userLogin.save();

    Esto sigue funcionando porque userLogin es un documento Mongoose que ya tiene métodos como .save() disponibles, lo cual es posible porque Mongoose está manejando esa instancia del modelo internamente.

Resumen:

    No necesitas importar Mongoose en local-strategy.js porque las funciones de servicio (services.login(), services.getUser(), etc.) ya se encargan de interactuar con Mongoose y devolver los documentos Mongoose.
    El método save() está disponible porque userLogin es un documento Mongoose que proviene de la función de servicio que ya ha hecho uso de Mongoose para conectar con la base de datos.

Este patrón sigue la separación de responsabilidades, donde el archivo local-strategy.js se centra en la lógica de autenticación y delega las operaciones de base de datos a los servicios, que son los encargados de manejar Mongoose.

*/

