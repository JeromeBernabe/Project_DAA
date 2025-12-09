-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 09, 2025 at 02:24 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gamified_app`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `color` varchar(7) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clustering_results`
--

CREATE TABLE `clustering_results` (
  `cluster_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `cluster_label` int(11) NOT NULL,
  `cluster_name` varchar(100) DEFAULT NULL,
  `cluster_characteristics` text DEFAULT NULL,
  `member_count` int(11) DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `combos`
--

CREATE TABLE `combos` (
  `combo_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `status` enum('pending','in_progress','completed','failed') DEFAULT 'pending',
  `critical_path_data` text DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `xp_earned` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `deadline_changes`
--

CREATE TABLE `deadline_changes` (
  `change_id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `old_deadline` datetime NOT NULL,
  `new_deadline` datetime NOT NULL,
  `reason` varchar(200) DEFAULT NULL,
  `changed_by_user` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `habits`
--

CREATE TABLE `habits` (
  `habit_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `difficulty` enum('easy','medium','hard','extreme') DEFAULT 'medium',
  `recurrence_pattern` varchar(50) DEFAULT NULL,
  `current_streak` int(11) DEFAULT 0,
  `best_streak` int(11) DEFAULT 0,
  `last_completed_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `habits`
--

INSERT INTO `habits` (`habit_id`, `user_id`, `category_id`, `title`, `description`, `difficulty`, `recurrence_pattern`, `current_streak`, `best_streak`, `last_completed_date`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 'Drinking Coffee', NULL, 'medium', '{\"days\":[1,2,3,4,5]}', 3, 3, '2025-12-09', 1, '2025-12-09 13:21:14', '2025-12-09 13:21:29');

-- --------------------------------------------------------

--
-- Table structure for table `habit_completions`
--

CREATE TABLE `habit_completions` (
  `completion_id` int(11) NOT NULL,
  `habit_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `completion_date` date NOT NULL,
  `completed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `xp_earned` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `habit_completions`
--

INSERT INTO `habit_completions` (`completion_id`, `habit_id`, `user_id`, `completion_date`, `completed_at`, `xp_earned`) VALUES
(1, 1, 1, '2025-12-09', '2025-12-09 13:21:17', 10);

-- --------------------------------------------------------

--
-- Table structure for table `level_requirements`
--

CREATE TABLE `level_requirements` (
  `level` int(11) NOT NULL,
  `xp_required` int(11) NOT NULL,
  `level_name` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `level_requirements`
--

INSERT INTO `level_requirements` (`level`, `xp_required`, `level_name`) VALUES
(1, 0, 'Novice'),
(2, 100, 'Beginner'),
(3, 250, 'Apprentice'),
(4, 500, 'Intermediate'),
(5, 1000, 'Advanced'),
(6, 2000, 'Expert'),
(7, 4000, 'Master'),
(8, 8000, 'Grandmaster'),
(9, 16000, 'Legend'),
(10, 32000, 'Mythic');

-- --------------------------------------------------------

--
-- Table structure for table `mcda_criteria`
--

CREATE TABLE `mcda_criteria` (
  `criteria_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `criteria_name` varchar(50) NOT NULL,
  `weight` decimal(3,2) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `scheduled_tasks`
--

CREATE TABLE `scheduled_tasks` (
  `schedule_id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `scheduled_date` date NOT NULL,
  `scheduled_start_time` time DEFAULT NULL,
  `scheduled_end_time` time DEFAULT NULL,
  `is_current` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `combo_id` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `difficulty` enum('easy','medium','hard','extreme') DEFAULT 'medium',
  `estimated_duration` int(11) DEFAULT NULL,
  `deadline` datetime DEFAULT NULL,
  `original_deadline` datetime DEFAULT NULL,
  `priority_score` decimal(5,2) DEFAULT NULL,
  `status` enum('pending','in_progress','completed','skipped','failed') DEFAULT 'pending',
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `xp_earned` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`task_id`, `user_id`, `category_id`, `combo_id`, `title`, `description`, `difficulty`, `estimated_duration`, `deadline`, `original_deadline`, `priority_score`, `status`, `started_at`, `completed_at`, `xp_earned`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, NULL, 'jkdhjkfhjkd', '', 'medium', NULL, '2025-12-10 21:20:00', NULL, NULL, 'completed', NULL, '2025-12-09 13:20:14', 25, '2025-12-09 13:20:08', '2025-12-09 13:20:14'),
(2, 1, NULL, NULL, 'zXzDsdaD', '', 'hard', NULL, NULL, NULL, NULL, 'completed', NULL, '2025-12-09 13:21:55', 50, '2025-12-09 13:21:49', '2025-12-09 13:21:55');

-- --------------------------------------------------------

--
-- Table structure for table `task_criteria_scores`
--

CREATE TABLE `task_criteria_scores` (
  `score_id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `criteria_id` int(11) NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `task_dependencies`
--

CREATE TABLE `task_dependencies` (
  `dependency_id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `depends_on_task_id` int(11) NOT NULL,
  `dependency_type` enum('finish_to_start','start_to_start','finish_to_finish') DEFAULT 'finish_to_start',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `total_xp` int(11) DEFAULT 0,
  `current_level` int(11) DEFAULT 1,
  `global_streak` int(11) DEFAULT 0,
  `last_active_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password_hash`, `total_xp`, `current_level`, `global_streak`, `last_active_date`, `created_at`, `updated_at`) VALUES
(1, 'Jerome', 'jerbz1122@gmail.com', '$2y$10$0JMkiBlwk3tmNBVUkKwzz.49pDA6hUCtpjirC7PmOIIenvJVzCNTa', 105, 2, 0, NULL, '2025-12-09 12:27:28', '2025-12-09 13:21:55');

-- --------------------------------------------------------

--
-- Table structure for table `weekly_analytics`
--

CREATE TABLE `weekly_analytics` (
  `analytics_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `week_start_date` date NOT NULL,
  `week_end_date` date NOT NULL,
  `total_tasks_completed` int(11) DEFAULT 0,
  `total_tasks_failed` int(11) DEFAULT 0,
  `total_habits_completed` int(11) DEFAULT 0,
  `total_xp_earned` int(11) DEFAULT 0,
  `avg_completion_time` decimal(10,2) DEFAULT NULL,
  `cluster_label` int(11) DEFAULT NULL,
  `productivity_score` decimal(5,2) DEFAULT NULL,
  `analytics_data` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `xp_transactions`
--

CREATE TABLE `xp_transactions` (
  `transaction_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `source_type` enum('task','habit','combo','streak_bonus','other') DEFAULT NULL,
  `source_id` int(11) DEFAULT NULL,
  `xp_amount` int(11) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `xp_transactions`
--

INSERT INTO `xp_transactions` (`transaction_id`, `user_id`, `source_type`, `source_id`, `xp_amount`, `description`, `created_at`) VALUES
(1, 1, 'task', 1, 25, 'Task completed', '2025-12-09 13:20:14'),
(2, 1, 'habit', 1, 10, NULL, '2025-12-09 13:21:17'),
(3, 1, 'habit', 1, 10, NULL, '2025-12-09 13:21:22'),
(4, 1, 'habit', 1, 10, NULL, '2025-12-09 13:21:29'),
(5, 1, 'task', 2, 50, 'Task completed', '2025-12-09 13:21:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `unique_user_category` (`user_id`,`name`);

--
-- Indexes for table `clustering_results`
--
ALTER TABLE `clustering_results`
  ADD PRIMARY KEY (`cluster_id`),
  ADD KEY `idx_user_cluster` (`user_id`,`cluster_label`);

--
-- Indexes for table `combos`
--
ALTER TABLE `combos`
  ADD PRIMARY KEY (`combo_id`),
  ADD KEY `idx_user_status` (`user_id`,`status`);

--
-- Indexes for table `deadline_changes`
--
ALTER TABLE `deadline_changes`
  ADD PRIMARY KEY (`change_id`),
  ADD KEY `idx_task` (`task_id`);

--
-- Indexes for table `habits`
--
ALTER TABLE `habits`
  ADD PRIMARY KEY (`habit_id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_user_active` (`user_id`,`is_active`);

--
-- Indexes for table `habit_completions`
--
ALTER TABLE `habit_completions`
  ADD PRIMARY KEY (`completion_id`),
  ADD UNIQUE KEY `unique_habit_date` (`habit_id`,`completion_date`),
  ADD KEY `idx_user_date` (`user_id`,`completion_date`);

--
-- Indexes for table `level_requirements`
--
ALTER TABLE `level_requirements`
  ADD PRIMARY KEY (`level`);

--
-- Indexes for table `mcda_criteria`
--
ALTER TABLE `mcda_criteria`
  ADD PRIMARY KEY (`criteria_id`),
  ADD UNIQUE KEY `unique_user_criteria` (`user_id`,`criteria_name`);

--
-- Indexes for table `scheduled_tasks`
--
ALTER TABLE `scheduled_tasks`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `task_id` (`task_id`),
  ADD KEY `idx_user_date` (`user_id`,`scheduled_date`,`is_current`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`task_id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `idx_user_status` (`user_id`,`status`),
  ADD KEY `idx_deadline` (`deadline`),
  ADD KEY `idx_combo` (`combo_id`);

--
-- Indexes for table `task_criteria_scores`
--
ALTER TABLE `task_criteria_scores`
  ADD PRIMARY KEY (`score_id`),
  ADD UNIQUE KEY `unique_task_criteria` (`task_id`,`criteria_id`),
  ADD KEY `criteria_id` (`criteria_id`);

--
-- Indexes for table `task_dependencies`
--
ALTER TABLE `task_dependencies`
  ADD PRIMARY KEY (`dependency_id`),
  ADD UNIQUE KEY `unique_dependency` (`task_id`,`depends_on_task_id`),
  ADD KEY `depends_on_task_id` (`depends_on_task_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `weekly_analytics`
--
ALTER TABLE `weekly_analytics`
  ADD PRIMARY KEY (`analytics_id`),
  ADD UNIQUE KEY `unique_user_week` (`user_id`,`week_start_date`),
  ADD KEY `idx_user_week` (`user_id`,`week_start_date`);

--
-- Indexes for table `xp_transactions`
--
ALTER TABLE `xp_transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `idx_user_date` (`user_id`,`created_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clustering_results`
--
ALTER TABLE `clustering_results`
  MODIFY `cluster_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `combos`
--
ALTER TABLE `combos`
  MODIFY `combo_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deadline_changes`
--
ALTER TABLE `deadline_changes`
  MODIFY `change_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `habits`
--
ALTER TABLE `habits`
  MODIFY `habit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `habit_completions`
--
ALTER TABLE `habit_completions`
  MODIFY `completion_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `mcda_criteria`
--
ALTER TABLE `mcda_criteria`
  MODIFY `criteria_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `scheduled_tasks`
--
ALTER TABLE `scheduled_tasks`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `task_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `task_criteria_scores`
--
ALTER TABLE `task_criteria_scores`
  MODIFY `score_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `task_dependencies`
--
ALTER TABLE `task_dependencies`
  MODIFY `dependency_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `weekly_analytics`
--
ALTER TABLE `weekly_analytics`
  MODIFY `analytics_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `xp_transactions`
--
ALTER TABLE `xp_transactions`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `clustering_results`
--
ALTER TABLE `clustering_results`
  ADD CONSTRAINT `clustering_results_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `combos`
--
ALTER TABLE `combos`
  ADD CONSTRAINT `combos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `deadline_changes`
--
ALTER TABLE `deadline_changes`
  ADD CONSTRAINT `deadline_changes_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE;

--
-- Constraints for table `habits`
--
ALTER TABLE `habits`
  ADD CONSTRAINT `habits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `habits_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL;

--
-- Constraints for table `habit_completions`
--
ALTER TABLE `habit_completions`
  ADD CONSTRAINT `habit_completions_ibfk_1` FOREIGN KEY (`habit_id`) REFERENCES `habits` (`habit_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `habit_completions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `mcda_criteria`
--
ALTER TABLE `mcda_criteria`
  ADD CONSTRAINT `mcda_criteria_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `scheduled_tasks`
--
ALTER TABLE `scheduled_tasks`
  ADD CONSTRAINT `scheduled_tasks_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `scheduled_tasks_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL;

--
-- Constraints for table `task_criteria_scores`
--
ALTER TABLE `task_criteria_scores`
  ADD CONSTRAINT `task_criteria_scores_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_criteria_scores_ibfk_2` FOREIGN KEY (`criteria_id`) REFERENCES `mcda_criteria` (`criteria_id`) ON DELETE CASCADE;

--
-- Constraints for table `task_dependencies`
--
ALTER TABLE `task_dependencies`
  ADD CONSTRAINT `task_dependencies_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_dependencies_ibfk_2` FOREIGN KEY (`depends_on_task_id`) REFERENCES `tasks` (`task_id`) ON DELETE CASCADE;

--
-- Constraints for table `weekly_analytics`
--
ALTER TABLE `weekly_analytics`
  ADD CONSTRAINT `weekly_analytics_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `xp_transactions`
--
ALTER TABLE `xp_transactions`
  ADD CONSTRAINT `xp_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
