-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 08/10/2024 às 18:29
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `jm`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `boleta`
--

CREATE TABLE `boleta` (
  `id` int(11) NOT NULL,
  `id_cliente` int(11) DEFAULT NULL,
  `valor_total` int(11) NOT NULL,
  `valor_pagado` int(11) NOT NULL,
  `cantidad_total_productos` int(11) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `metodo_pago` varchar(50) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updateAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `boleta`
--

INSERT INTO `boleta` (`id`, `id_cliente`, `valor_total`, `valor_pagado`, `cantidad_total_productos`, `id_usuario`, `metodo_pago`, `estado`, `createdAt`, `updateAt`) VALUES
(1, 1, 19000, 19000, 5, 5, 'credito', 1, '2024-09-03 22:22:06', '2024-09-03 22:22:06'),
(2, 1, 65000, 65000, 5, 5, 'credito', 1, '2024-09-03 22:27:58', '2024-09-03 22:27:58'),
(3, 1, 65000, 65000, 5, 5, 'credito', 1, '2024-09-03 22:28:15', '2024-09-03 22:28:15'),
(4, 1, 65000, 65000, 5, 5, 'debito', 1, '2024-09-03 22:32:59', '2024-09-03 22:32:59'),
(5, 1, 21000, 21000, 4, 5, 'debito', 1, '2024-09-03 22:33:31', '2024-09-03 22:33:31');

-- --------------------------------------------------------

--
-- Estrutura para tabela `cliente`
--

CREATE TABLE `cliente` (
  `id` int(11) NOT NULL,
  `rut` varchar(20) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `apellido` varchar(50) NOT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `cliente`
--

INSERT INTO `cliente` (`id`, `rut`, `nombre`, `apellido`, `telefono`, `correo`, `estado`, `createdAt`, `updatedAt`) VALUES
(1, '19389663-4', 'SOFIA LORETO', 'CANCINO BECERRA', '123456789', 'SOFIA@GMAIL.COM', 0, '2024-09-02 22:02:00', '2024-09-02 23:06:06'),
(3, '25959867-2', 'DEAN', 'MARINEK', '123456789', 'DEAN@GMAIL.COM', 1, '2024-09-03 02:46:03', '2024-09-03 02:46:03');

-- --------------------------------------------------------

--
-- Estrutura para tabela `deudacliente`
--

CREATE TABLE `deudacliente` (
  `id` int(11) NOT NULL,
  `id_boleta` int(11) DEFAULT NULL,
  `monto_deuda` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `ingresoproductos`
--

CREATE TABLE `ingresoproductos` (
  `id` int(11) NOT NULL,
  `id_producto` int(11) DEFAULT NULL,
  `cantidad` int(11) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updateAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `ingresoproductos`
--

INSERT INTO `ingresoproductos` (`id`, `id_producto`, `cantidad`, `id_usuario`, `createdAt`, `updateAt`) VALUES
(1, 1, 30, 5, '2024-09-03 19:43:51', '2024-09-03 19:43:51');

-- --------------------------------------------------------

--
-- Estrutura para tabela `pagodeuda`
--

CREATE TABLE `pagodeuda` (
  `id` int(11) NOT NULL,
  `id_deudaCliente` int(11) DEFAULT NULL,
  `metodo_pago` varchar(50) DEFAULT NULL,
  `monto_abonado` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `producto`
--

CREATE TABLE `producto` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `stock` int(11) NOT NULL,
  `estado` tinyint(1) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `producto`
--

INSERT INTO `producto` (`id`, `nombre`, `stock`, `estado`, `createdAt`, `updatedAt`) VALUES
(1, 'tomate raff', 72, 0, '2024-09-03 02:54:46', '2024-09-09 01:45:58'),
(2, 'frutillas', 50, 0, '2024-09-03 21:38:40', '2024-09-19 17:08:31');

-- --------------------------------------------------------

--
-- Estrutura para tabela `productoboleta`
--

CREATE TABLE `productoboleta` (
  `id` int(11) NOT NULL,
  `id_producto` int(11) DEFAULT NULL,
  `id_boleta` int(11) DEFAULT NULL,
  `cantidad` int(11) NOT NULL,
  `monto_unitario_cobrado` int(11) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `productoboleta`
--

INSERT INTO `productoboleta` (`id`, `id_producto`, `id_boleta`, `cantidad`, `monto_unitario_cobrado`, `createdAt`, `updatedAt`) VALUES
(1, 1, 3, 2, 10000, '2024-09-03 22:28:15', '2024-09-03 22:28:15'),
(2, 2, 3, 3, 15000, '2024-09-03 22:28:15', '2024-09-03 22:28:15'),
(3, 1, 4, 2, 10000, '2024-09-03 22:32:59', '2024-09-03 22:32:59'),
(4, 2, 4, 3, 15000, '2024-09-03 22:32:59', '2024-09-03 22:32:59'),
(5, 1, 5, 1, 6000, '2024-09-03 22:33:31', '2024-09-03 22:33:31'),
(6, 2, 5, 3, 5000, '2024-09-03 22:33:31', '2024-09-03 22:33:31');

-- --------------------------------------------------------

--
-- Estrutura para tabela `rolusuario`
--

CREATE TABLE `rolusuario` (
  `id` int(11) NOT NULL,
  `nombre_rol` varchar(50) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `rolusuario`
--

INSERT INTO `rolusuario` (`id`, `nombre_rol`, `descripcion`, `createdAt`, `updatedAt`) VALUES
(1, 'ADMIN', 'ACCESO TOTAL', '2024-09-02 15:48:29', '2024-09-02 15:48:29'),
(2, 'VENTAS', 'GESTIÓN DE VENTAS', '2024-09-02 16:31:07', '2024-09-02 16:31:07');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario`
--

CREATE TABLE `usuario` (
  `id` int(11) NOT NULL,
  `nombre_usuario` varchar(50) NOT NULL,
  `contraseña` varchar(255) NOT NULL,
  `estado` tinyint(1) NOT NULL,
  `id_rol` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuario`
--

INSERT INTO `usuario` (`id`, `nombre_usuario`, `contraseña`, `estado`, `id_rol`, `createdAt`, `updatedAt`) VALUES
(2, 'ANDERSONSILVA', '$2b$10$MpZr2saiIYAPPraPrgcr9.cBxRJ9aAS9KldhkMK3MRi68lT.Jed0u', 0, 1, '2024-09-02 15:48:34', '2024-09-04 03:06:35'),
(4, 'sofi', '$2b$10$w/1EzyRT5ZbyfrXWo3xmoe0p8CFwJNKNk.wtcWhgdWjrweWhhGKKm', 1, 2, '2024-09-02 16:31:13', '2024-09-02 16:31:13'),
(5, 'COSMOSS2', '$2b$10$MtifYBDO9zG22fXpK7kl5eRXSQySqj02JPIvowsXC3fMDQQXlDeWi', 1, 1, '2024-09-02 19:21:46', '2024-10-08 15:49:08'),
(6, 'BIGODIN', '$2b$10$z/S0ztig.F0nIOPA9U6pje/pYr1ufdPZptSxK40NNLnbJy8Z5Z9Ei', 1, 2, '2024-09-02 19:24:00', '2024-09-02 19:24:00');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `boleta`
--
ALTER TABLE `boleta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_cliente` (`id_cliente`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Índices de tabela `cliente`
--
ALTER TABLE `cliente`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `deudacliente`
--
ALTER TABLE `deudacliente`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_boleta` (`id_boleta`);

--
-- Índices de tabela `ingresoproductos`
--
ALTER TABLE `ingresoproductos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_producto` (`id_producto`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Índices de tabela `pagodeuda`
--
ALTER TABLE `pagodeuda`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_deudaCliente` (`id_deudaCliente`);

--
-- Índices de tabela `producto`
--
ALTER TABLE `producto`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `productoboleta`
--
ALTER TABLE `productoboleta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_producto` (`id_producto`),
  ADD KEY `id_boleta` (`id_boleta`);

--
-- Índices de tabela `rolusuario`
--
ALTER TABLE `rolusuario`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_rol` (`id_rol`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `boleta`
--
ALTER TABLE `boleta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `cliente`
--
ALTER TABLE `cliente`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `deudacliente`
--
ALTER TABLE `deudacliente`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `ingresoproductos`
--
ALTER TABLE `ingresoproductos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `pagodeuda`
--
ALTER TABLE `pagodeuda`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `producto`
--
ALTER TABLE `producto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `productoboleta`
--
ALTER TABLE `productoboleta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de tabela `rolusuario`
--
ALTER TABLE `rolusuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `boleta`
--
ALTER TABLE `boleta`
  ADD CONSTRAINT `boleta_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id`),
  ADD CONSTRAINT `boleta_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id`);

--
-- Restrições para tabelas `deudacliente`
--
ALTER TABLE `deudacliente`
  ADD CONSTRAINT `deudacliente_ibfk_1` FOREIGN KEY (`id_boleta`) REFERENCES `boleta` (`id`);

--
-- Restrições para tabelas `ingresoproductos`
--
ALTER TABLE `ingresoproductos`
  ADD CONSTRAINT `ingresoProductos_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id`),
  ADD CONSTRAINT `ingresoProductos_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id`);

--
-- Restrições para tabelas `pagodeuda`
--
ALTER TABLE `pagodeuda`
  ADD CONSTRAINT `pagodeuda_ibfk_1` FOREIGN KEY (`id_deudaCliente`) REFERENCES `deudacliente` (`id`);

--
-- Restrições para tabelas `productoboleta`
--
ALTER TABLE `productoboleta`
  ADD CONSTRAINT `productoboleta_ibfk_1` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id`),
  ADD CONSTRAINT `productoboleta_ibfk_2` FOREIGN KEY (`id_boleta`) REFERENCES `boleta` (`id`);

--
-- Restrições para tabelas `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `rolusuario` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
