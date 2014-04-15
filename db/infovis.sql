-- phpMyAdmin SQL Dump
-- version 3.5.2.2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generato il: Feb 17, 2014 alle 21:39
-- Versione del server: 5.5.27
-- Versione PHP: 5.4.7

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `infovis`
--

-- --------------------------------------------------------

--
-- Struttura della tabella `coffee`
--

CREATE TABLE IF NOT EXISTS `coffee` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dump dei dati per la tabella `coffee`
--

INSERT INTO `coffee` (`id`, `name`) VALUES
(1, '95deg'),
(2, '1950m'),
(3, '50g'),
(4, '18c');

-- --------------------------------------------------------

--
-- Struttura della tabella `feedback`
--

CREATE TABLE IF NOT EXISTS `feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sendtime` datetime NOT NULL,
  `hotel` varchar(20) NOT NULL,
  `flavour` int(11) DEFAULT NULL,
  `freshness` int(11) DEFAULT NULL,
  `temperature` int(11) DEFAULT NULL,
  `service` int(11) DEFAULT NULL,
  `country` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=45 ;

--
-- Dump dei dati per la tabella `feedback`
--

INSERT INTO `feedback` (`id`, `sendtime`, `hotel`, `flavour`, `freshness`, `temperature`, `service`, `country`) VALUES
(1, '2014-02-17 15:49:08', 'Palatino', 3, 3, 4, 3, 'Italia'),
(2, '2014-02-17 15:49:08', 'Palatino', 4, 3, 4, 3, 'Italia'),
(3, '2014-02-17 15:49:08', 'Palatino', 3, 2, 2, 3, 'Germania'),
(4, '2014-02-17 15:49:08', 'Palatino', 3, 3, 2, 4, 'Francia'),
(5, '2014-02-17 15:49:08', 'Palatino', 3, 2, 4, 3, 'Francia'),
(6, '2014-02-17 15:49:08', 'Palatino', 2, 3, 4, 3, 'USA'),
(7, '2014-02-17 15:49:08', 'Palatino', 3, 3, 4, 3, 'USA'),
(8, '2014-02-17 15:49:08', 'Palatino', 3, 2, 3, 4, 'Italia'),
(9, '2014-02-17 15:49:08', 'Palatino', 4, 3, 4, 3, 'Germania'),
(10, '2014-02-17 15:49:08', 'Palatino', 3, 2, 3, 2, 'UK'),
(11, '2014-02-17 15:49:08', 'Palatino', 3, 3, 4, 3, 'UK'),
(12, '2014-02-17 15:49:08', 'Superior', 4, 3, 3, 4, 'Italia'),
(13, '2014-02-17 15:49:08', 'Superior', 4, 3, 4, 3, 'Italia'),
(14, '2014-02-17 15:49:08', 'Superior', 3, 2, 2, 3, 'Germania'),
(15, '2014-02-17 15:49:08', 'Superior', 3, 3, 2, 4, 'Francia'),
(16, '2014-02-17 15:49:08', 'Superior', 2, 2, 4, 3, 'Francia'),
(17, '2014-02-17 15:49:08', 'Superior', 2, 4, 4, 3, 'USA'),
(18, '2014-02-17 15:49:08', 'Excelsior', 2, 3, 4, 3, 'USA'),
(19, '2014-02-17 15:49:08', 'Excelsior', 3, 2, 3, 4, 'Italia'),
(20, '2014-02-17 15:49:08', 'Excelsior', 3, 3, 4, 3, 'Germania'),
(21, '2014-02-17 15:49:08', 'Excelsior', 2, 4, 4, 2, 'UK'),
(22, '2014-02-17 15:49:08', 'Excelsior', 3, 2, 3, 4, 'UK'),
(23, '2014-02-17 15:55:11', 'Palatino', 3, 3, 4, 3, 'Italia'),
(24, '2014-02-17 15:55:11', 'Palatino', 4, 3, 4, 3, 'Italia'),
(25, '2014-02-17 15:55:11', 'Palatino', 3, 2, 2, 3, 'Germania'),
(26, '2014-02-17 15:55:11', 'Palatino', 3, 3, 2, 4, 'Francia'),
(27, '2014-02-17 15:55:11', 'Palatino', 3, 2, 4, 3, 'Francia'),
(28, '2014-02-17 15:55:11', 'Palatino', 2, 3, 4, 3, 'USA'),
(29, '2014-02-17 15:55:11', 'Palatino', 3, 3, 4, 3, 'USA'),
(30, '2014-02-17 15:55:11', 'Palatino', 3, 2, 3, 4, 'Italia'),
(31, '2014-02-17 15:55:11', 'Palatino', 4, 3, 4, 3, 'Germania'),
(32, '2014-02-17 15:55:11', 'Palatino', 3, 2, 3, 2, 'UK'),
(33, '2014-02-17 15:55:11', 'Palatino', 3, 3, 4, 3, 'UK'),
(34, '2014-02-17 15:55:11', 'Superior', 4, 3, 3, 4, 'Italia'),
(35, '2014-02-17 15:55:11', 'Superior', 4, 3, 4, 3, 'Italia'),
(36, '2014-02-17 15:55:11', 'Superior', 3, 2, 2, 3, 'Germania'),
(37, '2014-02-17 15:55:11', 'Superior', 3, 3, 2, 4, 'Francia'),
(38, '2014-02-17 15:55:11', 'Superior', 2, 2, 4, 3, 'Francia'),
(39, '2014-02-17 15:55:11', 'Superior', 2, 4, 4, 3, 'USA'),
(40, '2014-02-17 15:55:11', 'Excelsior', 2, 3, 4, 3, 'USA'),
(41, '2014-02-17 15:55:11', 'Excelsior', 3, 2, 3, 4, 'Italia'),
(42, '2014-02-17 15:55:11', 'Excelsior', 3, 3, 4, 3, 'Germania'),
(43, '2014-02-17 15:55:11', 'Excelsior', 2, 4, 4, 2, 'UK'),
(44, '2014-02-17 15:55:11', 'Excelsior', 3, 2, 3, 4, 'UK');

-- --------------------------------------------------------

--
-- Struttura della tabella `hotel`
--

CREATE TABLE IF NOT EXISTS `hotel` (
  `name` varchar(20) NOT NULL,
  `region` varchar(20) NOT NULL,
  `address` varchar(50) NOT NULL DEFAULT '',
  PRIMARY KEY (`name`,`region`,`address`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dump dei dati per la tabella `hotel`
--

INSERT INTO `hotel` (`name`, `region`, `address`) VALUES
('Accor Holels', 'Marche', ''),
('Accor Hotels', 'Toscana', ''),
('Excelsior', 'Toscana', ''),
('Magnola', 'Abruzzo', ''),
('Palatino', 'Lazio', ''),
('Palatino', 'Lazio', 'Via quellochevuoi, 12'),
('Park Holel', 'Abruzzo', ''),
('Park Holel', 'Lazio', ''),
('Superior', 'Lazio', '');

-- --------------------------------------------------------

--
-- Struttura della tabella `procapita`
--

CREATE TABLE IF NOT EXISTS `procapita` (
  `nationality` varchar(20) NOT NULL,
  `quantity` float NOT NULL,
  PRIMARY KEY (`nationality`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Struttura della tabella `sell`
--

CREATE TABLE IF NOT EXISTS `sell` (
  `selldate` date NOT NULL,
  `coffee` varchar(20) NOT NULL,
  `hotel` varchar(20) NOT NULL,
  `quantity` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
