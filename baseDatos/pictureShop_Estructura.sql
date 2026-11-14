-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: pictureshop
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accesoevento`
--

DROP TABLE IF EXISTS `accesoevento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accesoevento` (
  `idAcceso` int NOT NULL AUTO_INCREMENT,
  `idCliente` int NOT NULL,
  `idEvento` int NOT NULL,
  `fechaAcceso` datetime NOT NULL,
  PRIMARY KEY (`idAcceso`),
  KEY `fkAccesoCliente` (`idCliente`),
  KEY `fkAccesoEvento` (`idEvento`),
  CONSTRAINT `fkAccesoCliente` FOREIGN KEY (`idCliente`) REFERENCES `usuariocliente` (`idCliente`),
  CONSTRAINT `fkAccesoEvento` FOREIGN KEY (`idEvento`) REFERENCES `evento` (`idEvento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `carrito`
--

DROP TABLE IF EXISTS `carrito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrito` (
  `idCarrito` int NOT NULL AUTO_INCREMENT,
  `idCliente` int NOT NULL,
  `idEvento` int NOT NULL,
  `fechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaActualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idCarrito`),
  KEY `fkCarritoCliente` (`idCliente`),
  KEY `fkCarritoEvento` (`idEvento`),
  CONSTRAINT `fkCarritoCliente` FOREIGN KEY (`idCliente`) REFERENCES `usuariocliente` (`idCliente`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fkCarritoEvento` FOREIGN KEY (`idEvento`) REFERENCES `evento` (`idEvento`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `detallecarrito`
--

DROP TABLE IF EXISTS `detallecarrito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detallecarrito` (
  `idDetalleCarrito` int NOT NULL AUTO_INCREMENT,
  `idCarrito` int NOT NULL,
  `idFoto` int NOT NULL,
  PRIMARY KEY (`idDetalleCarrito`),
  UNIQUE KEY `uqCarritoFoto` (`idCarrito`,`idFoto`),
  KEY `fkDetalleCarritoFoto` (`idFoto`),
  CONSTRAINT `fkDetalleCarrito` FOREIGN KEY (`idCarrito`) REFERENCES `carrito` (`idCarrito`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fkDetalleCarritoFoto` FOREIGN KEY (`idFoto`) REFERENCES `foto` (`idFoto`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `detallepedido`
--

DROP TABLE IF EXISTS `detallepedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detallepedido` (
  `idDetallePedido` int NOT NULL AUTO_INCREMENT,
  `idPedido` int NOT NULL,
  `idFoto` int NOT NULL,
  `precioUnitario` decimal(8,2) NOT NULL,
  PRIMARY KEY (`idDetallePedido`),
  UNIQUE KEY `uqPedidoFoto` (`idPedido`,`idFoto`),
  KEY `fkDetallePedidoFoto` (`idFoto`),
  CONSTRAINT `fkDetallePedido` FOREIGN KEY (`idPedido`) REFERENCES `pedido` (`idPedido`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fkDetallePedidoFoto` FOREIGN KEY (`idFoto`) REFERENCES `foto` (`idFoto`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chkPrecioUnitario` CHECK ((`precioUnitario` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `evento`
--

DROP TABLE IF EXISTS `evento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evento` (
  `idEvento` int NOT NULL AUTO_INCREMENT,
  `idFotografo` int DEFAULT NULL,
  `nombreEvento` varchar(120) COLLATE latin1_spanish_ci DEFAULT NULL,
  `ubicacionEvento` varchar(200) COLLATE latin1_spanish_ci DEFAULT NULL,
  `costoFoto` decimal(10,0) DEFAULT NULL,
  `claveEntrar` varchar(120) COLLATE latin1_spanish_ci DEFAULT NULL,
  `ubicacionArchivos` varchar(255) COLLATE latin1_spanish_ci DEFAULT NULL,
  `claveVerificacionPago` varchar(120) COLLATE latin1_spanish_ci NOT NULL,
  `fechaCreacion` datetime NOT NULL,
  PRIMARY KEY (`idEvento`),
  KEY `fkEventoFotografo` (`idFotografo`),
  CONSTRAINT `fkEventoFotografo` FOREIGN KEY (`idFotografo`) REFERENCES `usuariofotografo` (`idFotografo`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1 COLLATE=latin1_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `foto`
--

DROP TABLE IF EXISTS `foto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `foto` (
  `idFoto` int NOT NULL AUTO_INCREMENT,
  `idEvento` int DEFAULT NULL,
  `nombreFoto` varchar(255) COLLATE latin1_spanish_ci DEFAULT NULL,
  `ubicacionArchivo` varchar(255) COLLATE latin1_spanish_ci DEFAULT NULL,
  `ubicacionVistaPrevia` varchar(255) COLLATE latin1_spanish_ci DEFAULT NULL,
  `fechaPublicacion` datetime NOT NULL,
  PRIMARY KEY (`idFoto`),
  KEY `fkFotoEvento` (`idEvento`),
  CONSTRAINT `fkFotoEvento` FOREIGN KEY (`idEvento`) REFERENCES `evento` (`idEvento`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pedido`
--

DROP TABLE IF EXISTS `pedido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedido` (
  `idPedido` int NOT NULL AUTO_INCREMENT,
  `idCliente` int NOT NULL,
  `idEvento` int NOT NULL,
  `montoTotal` decimal(10,2) NOT NULL,
  `estadoPedido` enum('pendiente','desbloqueado','cancelado') NOT NULL DEFAULT 'pendiente',
  `fechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaDesbloqueo` datetime DEFAULT NULL,
  PRIMARY KEY (`idPedido`),
  KEY `fkPedidoCliente` (`idCliente`),
  KEY `fkPedidoEvento` (`idEvento`),
  CONSTRAINT `fkPedidoCliente` FOREIGN KEY (`idCliente`) REFERENCES `usuariocliente` (`idCliente`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fkPedidoEvento` FOREIGN KEY (`idEvento`) REFERENCES `evento` (`idEvento`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chkMontoPedido` CHECK ((`montoTotal` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuariocliente`
--

DROP TABLE IF EXISTS `usuariocliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuariocliente` (
  `idCliente` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(85) COLLATE latin1_spanish_ci DEFAULT NULL,
  `telefono` varchar(20) COLLATE latin1_spanish_ci DEFAULT NULL,
  `correo` varchar(80) COLLATE latin1_spanish_ci DEFAULT NULL,
  `contrasena` varchar(255) COLLATE latin1_spanish_ci DEFAULT NULL,
  `fechaRegistro` datetime DEFAULT NULL,
  PRIMARY KEY (`idCliente`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1 COLLATE=latin1_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuariofotografo`
--

DROP TABLE IF EXISTS `usuariofotografo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuariofotografo` (
  `idFotografo` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(85) COLLATE latin1_spanish_ci NOT NULL,
  `telefono` varchar(20) COLLATE latin1_spanish_ci DEFAULT NULL,
  `correo` varchar(80) COLLATE latin1_spanish_ci DEFAULT NULL,
  `contrasena` varchar(255) COLLATE latin1_spanish_ci DEFAULT NULL,
  `fecharegistro` datetime DEFAULT NULL,
  PRIMARY KEY (`idFotografo`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1 COLLATE=latin1_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-14 10:31:54
