import { By, PageElement } from '@serenity-js/web';

export const LoginForm = {
  email: () => PageElement.located(By.id('email')).describedAs('campo de correo'),
  password: () => PageElement.located(By.id('password')).describedAs('campo de contraseña'),
  submit: () => PageElement.located(By.css('form button[type="submit"]')).describedAs('botón Iniciar sesión'),
};
