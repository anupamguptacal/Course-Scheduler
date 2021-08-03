<?php
	/*
		This PHP file runs on the server and exposes 3 API methods to the public : 

		1. ?all=true -> returns all the subjects currently available

			Example Response: 

				[ "AI", "CS"]

		2. ?all=true&subject=CS -> returns a list of all CS courses

			Example Response:

			["CS31005 - ALGORITHMS - II", "CS21201 - DISCRETE STRUCTURES", "CS60077 - REINFORCEMENT LEARNING"]

		3. ?subject=CS&course=143 -> returns details about CS course number 143

			Example Response: 

			{
				"course_number": "CS143",
				"course_name": "Test Course",
				"course_description": "Test Course Description",
				"instructor": "Test Instructor",
				"credits": "4",
				"timings": {
					"Monday": [
      					{
        					"start": "12:00",
        					"end": "13:55"
      					}
    				],
    				"Tuesday": [
      					{
        					"start": "9:00",
        					"end": "9:55"
      					}
    				]
  				}
			}

		All data is pulled from server files. This can later be moved to an in-memory database if file management becomes too cumbersome.

		@author - Anupam Gupta <anupamguptacal@gmail.com>
	*/
	
	header('Access-Control-Allow-Origin: *');

	function get_all_subjects() {
		$subjects = array();
		foreach(glob("subjects/*.txt") as $file_name) {
			array_push($subjects, basename($file_name, ".txt"));
		}
		header('Content-type: application/json');
		echo json_encode($subjects);
	}

	function get_all_courses($subject_name) {
		$file_name = 'subjects/'.$subject_name.'.txt';
		$courses = array();
		$file_content = file($file_name, FILE_IGNORE_NEW_LINES);
		if(!$file_content) {
			echo "Subject details not found";
		} else {
			foreach ($file_content as $line) {
				array_push($courses, $line);
			}
			header('Content-type: application/json');
			echo json_encode($courses);
		}
	}

	function get_course_info($subject_name, $course_number) {
		$file_name = 'courses/'.$subject_name.'/'.$course_number.'.txt';
		$file_content = file($file_name, FILE_IGNORE_NEW_LINES);
		if(!$file_content) {
			echo "Course details unavailable for this subject";
		} else {
			$to_return = array();
			$to_return['course_number'] = $file_content[0];
			$to_return['course_name'] = $file_content[1];
			$to_return['course_description'] = $file_content[2];
			$to_return['instructor'] = $file_content[3];
			$to_return['credits'] = $file_content[4];
			
			$timings = $file_content[5];
			$timings_array = explode('|', $timings);
			$time_array = array();
			foreach ($timings_array as $schedule) {
				$split = explode('=', $schedule);
				$day = trim($split[0]);
				$time = trim($split[1]);
				$number_of_timings_per_day = explode(',', $split[1]);
				$time_array[$day] = array();
				foreach($number_of_timings_per_day as $timing_per_day) {
					$time_split = explode('-', $timing_per_day);
					$start_time = trim($time_split[0]);
					$end_time = trim($time_split[1]);
					$individual_timing = array();
					$individual_timing['start'] = $start_time;
					$individual_timing['end'] = $end_time;
					array_push($time_array[$day], $individual_timing);
				}
			}
			$to_return['timings'] = $time_array;
			header('Content-type: application/json');
			echo json_encode($to_return);
		}
	}

	if(isset($_GET['all']) && ($_GET['all'] === 'true')) {
		if(isset($_GET['subject'])) {
			$subject = $_GET['subject'];
			get_all_courses($subject);
		} else {
			get_all_subjects();
		}
	} elseif (isset($_GET['subject'])) {
		if(!isset($_GET['course'])) {
			echo "No course number provided";
		} else {
			$course_number = $_GET['course'];
			$subject = $_GET['subject'];
			get_course_info($subject, $course_number);
		}
	} else {
		echo "Mode not recognized. Please specify all=true or a subject and course number";
	}
 ?>
