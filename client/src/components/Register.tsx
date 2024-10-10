import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import "../styles/Register.css";
import { useNavigate } from "react-router-dom";

const registerSchema = z.object({
  username: z.string().min(1, { message: "Имя пользователя обязательно" }),
  firstName: z.string().min(1, { message: "Имя обязательно" }),
  lastName: z.string().min(1, { message: "Фамилия обязательна" }),
  email: z.string().email({ message: "Неправильный адрес электронной почты" }),
  password: z
    .string()
    .min(6, { message: "Пароль должен содержать минимум 6 символов" }),
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

const saveToLocalStorage = (key: string, value: object) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const Register: React.FC = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger, // добавлено для валидации
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    try {
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      };

      const response = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        saveToLocalStorage("token", result.token);
        saveToLocalStorage("user", result.user);
        navigate("/");
      } else {
        const error = await response.json();
        alert(`Registration failed: ${error.message}`);
      }
    } catch (err) {
      console.error("Error during registration:", err);
      alert("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="full-container">
      <div className="register-container">
      <h1 className="register-title">Регистрация</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="firstName" className="form-label">
          Имя
          </label>
          <input
            id="firstName"
            type="text"
            {...register("firstName", {
              onChange: () => trigger("firstName"), // Вызываем валидацию на изменение
            })}
            className={`form-input ${errors.firstName ? "input-error" : ""}`}
          />
          {errors.firstName && (
            <p className="error-message">{errors.firstName.message}</p>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="lastName" className="form-label">
            Фамилия
          </label>
          <input
            id="lastName"
            type="text"
            // className="form-input"
            // {...register("lastName")}
            // onChange={() => trigger("lastName")}
            {...register("lastName", {
              onChange: () => trigger("lastName"), // Вызываем валидацию на изменение
            })}
            className={`form-input ${errors.lastName ? "input-error" : ""}`}
          />
          {errors.lastName && (
            <p className="error-message">{errors.lastName.message}</p>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="username" className="form-label">
            Имя пользователя
          </label>
          <input
            id="username"
            type="text"
            // {...register("username")}
            // className="form-input"
            // onChange={() => trigger("username")}
            {...register("username", {
              onChange: () => trigger("username"), // Вызываем валидацию на изменение
            })}
            className={`form-input ${errors.username ? "input-error" : ""}`}
            
          />
          {errors.username && (
            <p className="error-message">{errors.username.message}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
          Электронная почта
          </label>
          <input
            id="email"
            type="email"
            // {...register("email")}
            // className="form-input"
            // onChange={() => trigger("email")}
            {...register("email", {
              onChange: () => trigger("email"), // Вызываем валидацию на изменение
            })}
            className={`form-input ${errors.email ? "input-error" : ""}`}
          />
          {errors.email && (
            <p className="error-message">{errors.email.message}</p>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            // {...register("password")}
            // className="form-input"
            // onChange={() => trigger("password")}
            {...register("password", {
              onChange: () => trigger("password"), // Вызываем валидацию на изменение
            })}
            className={`form-input ${errors.password ? "input-error" : ""}`}
            
          />
          {errors.password && (
            <p className="error-message">{errors.password.message}</p>
          )}
        </div>
        <button type="submit" className="submit-button">
          Зарегестрироваться
        </button>
      </form>
      </div>
    </div>
  );
};

export default Register;
