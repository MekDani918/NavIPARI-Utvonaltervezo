-- phpMyAdmin SQL Dump
-- version 5.0.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 22, 2021 at 12:45 AM
-- Server version: 10.4.22-MariaDB
-- PHP Version: 7.4.7

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `model2`
--
CREATE DATABASE IF NOT EXISTS `model2` DEFAULT CHARACTER SET utf8 COLLATE utf8_hungarian_ci;
USE `model2`;

-- --------------------------------------------------------

--
-- Table structure for table `adjacency`
--

DROP TABLE IF EXISTS `adjacency`;
CREATE TABLE `adjacency` (
  `ID` int(11) NOT NULL,
  `NODE_ID` int(11) NOT NULL,
  `NEIGHBOUR_NODE_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nodes`
--

DROP TABLE IF EXISTS `nodes`;
CREATE TABLE `nodes` (
  `ID` int(11) NOT NULL,
  `POS_X` float NOT NULL,
  `POS_Y` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `terem_aliasok`
--

DROP TABLE IF EXISTS `terem_aliasok`;
CREATE TABLE `terem_aliasok` (
  `ID` int(11) NOT NULL,
  `TEREM_ID` int(11) NOT NULL,
  `ALIAS` varchar(45) COLLATE utf8_hungarian_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

-- --------------------------------------------------------

--
-- Table structure for table `termek`
--

DROP TABLE IF EXISTS `termek`;
CREATE TABLE `termek` (
  `ID` int(11) NOT NULL,
  `TEREM_SZAM` varchar(45) COLLATE utf8_hungarian_ci NOT NULL,
  `NODE_ID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_hungarian_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `adjacency`
--
ALTER TABLE `adjacency`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `NODE_ID` (`NODE_ID`),
  ADD KEY `NEIGHBOUR_NODE_ID` (`NEIGHBOUR_NODE_ID`);

--
-- Indexes for table `nodes`
--
ALTER TABLE `nodes`
  ADD PRIMARY KEY (`ID`);

--
-- Indexes for table `terem_aliasok`
--
ALTER TABLE `terem_aliasok`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `TEREM_ID` (`TEREM_ID`);

--
-- Indexes for table `termek`
--
ALTER TABLE `termek`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `NODE_ID` (`NODE_ID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `adjacency`
--
ALTER TABLE `adjacency`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `nodes`
--
ALTER TABLE `nodes`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `terem_aliasok`
--
ALTER TABLE `terem_aliasok`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `termek`
--
ALTER TABLE `termek`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `adjacency`
--
ALTER TABLE `adjacency`
  ADD CONSTRAINT `NEIGHBOUR_NODE_ID` FOREIGN KEY (`NEIGHBOUR_NODE_ID`) REFERENCES `nodes` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `NODE_ID` FOREIGN KEY (`NODE_ID`) REFERENCES `nodes` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `terem_aliasok`
--
ALTER TABLE `terem_aliasok`
  ADD CONSTRAINT `TEREM_ID` FOREIGN KEY (`TEREM_ID`) REFERENCES `termek` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Constraints for table `termek`
--
ALTER TABLE `termek`
  ADD CONSTRAINT `termek_ibfk_1` FOREIGN KEY (`NODE_ID`) REFERENCES `nodes` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
