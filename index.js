
/*
	JS file to work in tandem with index.html. Performs the following functions: 

	1. Queries, over the network, the APIs exposed by index.php to procure information on subjects available, courses per subject and course specific description and timings 
	2. Dynamically update different sections of the html page to display details about selected courses
	3. Compute whether the timings of the selected courses clash with each other (on an hourly demarcation basis) and update the DOM to display
		the result of the schedule computation
		3.1. If there is no conflict, a merged schedule is displayed in a tabular format (divided into hourly blocks).
		3.2. If there are conflicts, the schedules of all the courses, vertically aligned - by hour, is displayed so the user can choose which course
				to keep or drop before re-trying to create a merged schedule.

	@author - Anupam Gupta <anupamguptacal@gmail.com>

	Improvements: 
		1. Complete to-do to query list of all available courses from index.php API instead of hardcoding in index.html
		2. Fix corner-case robustness issues
		3. Fix code-redundancy issues, specifically, resetting the webpage to a blank board again on certain changes.

*/
(function() {	
	"use strict";

	var COURSE_RESOLUTION_MAP = {};
	const BASE_URL = "http://anupamguptacalcom.ipage.com/Course_Scheduler/index.php";
	const MIN_START_TIME = 7;
	const MAX_END_TIME = 19;
	const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
	const AVAILABLE_CLASSES = ["green", "red", "blue", "yellow", "purple"] // # of available classes also controls how many subjects can be chosen at once. Currently 5.
	let CLASS_DESIGNATION_MAP = {}; // stores CSS classes designated to each course. The classes control the same-course-same-color design scheme used through the website.

	/*
		Function to procure the starting hour from the time specified in the parameter. Any of the following parameters are supported: 
		1. HH:MM
		2. HH:MM:SS
	*/
	function get_starting_hour_from_time(time) {
		let hour = parseInt(time.split(':')[0]);
		return hour;
	}

	/*

		Function to detect if there are conflicts in the course timings for the courses specified within the all_courses parameter.
		1. Returns false if there is a conflict.
		2. Updates COURSE_RESOLUTION_MAP in the format {day_of_week -> {hour_of_day -> course_number}} if there are no conflicts and returns true.
			Can also deal with classes that span multiple hours, for example from 8 - 11, entries for hour 8, hour 9 and hour 10 for that specific day in the 
			dictionary will be updated to show as full as will be occupied by the course_number in question. 

	*/
	function detect_conflicts_in_courses(all_courses) {
		let result = true;
		all_courses.forEach((course, i)=> {
			DAYS_OF_WEEK.forEach((day_of_week, j) => {
				if(day_of_week in course['timings']) {
					let all_timings_for_day_of_week = course['timings'][day_of_week];
					all_timings_for_day_of_week.forEach((individual_time, k) => {
						let start_time = individual_time['start'];
						let starting_hour = get_starting_hour_from_time(start_time);
						let end_time = individual_time['end'];
						let counter = starting_hour;
						while(true) {
							// Assumes classes don't cross day boundaries and military time is used in returned timings
							let current_time = '01/01/2011 ' + counter + ":00:00";
							let end_time_appended = '01/01/2011 ' + end_time + ":00:00";
							if(Date.parse(current_time) > Date.parse(end_time_appended)) {
								break;
							}
							if(!(day_of_week in COURSE_RESOLUTION_MAP)) {
								COURSE_RESOLUTION_MAP[day_of_week] = {};
							}
							if((day_of_week in COURSE_RESOLUTION_MAP) && (counter in COURSE_RESOLUTION_MAP[day_of_week])) {
								COURSE_RESOLUTION_MAP = [];
								result = false;
								break;
							}
							COURSE_RESOLUTION_MAP[day_of_week][counter] = course['course_number'];
							counter++;
						}
					})
				}
			})
		})
		return result;	
	}


	/*
		
		Function to Dynamically update the merged table to contain the merged schedule as computed and stored in the COURSE_RESOLUTION_MAP.
		Toggles visibility of certain page elements as needed to clear page before posting results. 
		Should only be invoked post verification that the courese schedules don't collide and computing the merged schedule.
	
	*/
	function generate_merged_table() {
		document.getElementById("merged-table-space").classList.remove("invisible");
		document.getElementById("clashed-course-space").classList.add("invisible");
		let table = document.getElementById("merged-table");
		let counter = MIN_START_TIME;

		let row = document.createElement("tr");

		let data = document.createElement("th");
		data.innerText = "";
		row.appendChild(data);

		while(counter < MAX_END_TIME) {
			let data = document.createElement("th");
			data.innerText = counter++ + ":00 - " + counter + ":00";
			row.appendChild(data);
		}
		table.appendChild(row);
		for(let counter = 0; counter < DAYS_OF_WEEK.length; counter++) {
			let day_of_week = DAYS_OF_WEEK[counter];

			row = document.createElement("tr");
			let day = document.createElement("td");
			day.innerText = day_of_week;
			row.appendChild(day);

			for(let i = MIN_START_TIME; i < MAX_END_TIME; i++) {
				let course = document.createElement("td");
				if((day_of_week in COURSE_RESOLUTION_MAP) && (i in COURSE_RESOLUTION_MAP[day_of_week])) {
					course.innerText = COURSE_RESOLUTION_MAP[day_of_week][i];
					course.classList.add(CLASS_DESIGNATION_MAP[COURSE_RESOLUTION_MAP[day_of_week][i]]);
				} else {
					course.classList.add("grey");
					course.innerText = 'X';
				}
				row.appendChild(course);
			}

			table.appendChild(row);
		}
	}

	/*
		
		Function to Dynamically update the page to contain the individual schedules for each of the courses, partitioned per day per hour.
		Toggles visibility of certain page elements as needed to clear page before posting tables. 
		COURSE_RESOLUTION_MAP remains unchanged post completion of method.

	*/
	function generate_individual_tables(courses) {
		document.getElementById("merged-table-space").classList.add("invisible");
		document.getElementById("clashed-course-space").classList.remove("invisible");
		document.getElementById("table-container").innerHTML = "";
		courses.forEach((course, i) => {
			let heading = document.createElement("h3");
			heading.innerText = "Course Schedule for Course: " + course['course_number'];

			let table = document.createElement("table");

			document.getElementById("table-container").appendChild(heading);
			document.getElementById("table-container").appendChild(table);

			let counter = MIN_START_TIME;

			let row = document.createElement("tr");

			let data = document.createElement("th");
			data.innerText = "";
			row.appendChild(data);

			while(counter < MAX_END_TIME) {
				let data = document.createElement("th");
				data.innerText = counter++ + ":00 - " + counter + ":00";
				row.appendChild(data);
			}
			table.appendChild(row);

			let timings = course['timings'];
			for(let j = 0; j < DAYS_OF_WEEK.length; j++) {
				let day_of_week = DAYS_OF_WEEK[j];
				let all_hours_covered_in_day = [];
				if(day_of_week in timings) {
					let all_timings_for_day_of_week = timings[day_of_week];
					all_timings_for_day_of_week.forEach((individual_time, k) => {

						let start = individual_time['start'];
						let end = individual_time['end'];
						let start_hour = get_starting_hour_from_time(start);
						let time_counter = start_hour;

						while(true) {
							let current_time = '01/01/2011 ' + time_counter + ":00:00";
							let end_time = '01/01/2011 ' + end + ":00:00";
							if(Date.parse(current_time) > Date.parse(end_time)) {
								break;
							}
							all_hours_covered_in_day.push(time_counter);
							time_counter++;
						}
					})
				}

				row = document.createElement("tr");

				let day = document.createElement("td");
				day.innerText = day_of_week;
				row.appendChild(day);

				counter = MIN_START_TIME;
				while(counter < MAX_END_TIME) {
					let data_value = document.createElement("td");

					if(all_hours_covered_in_day.includes(counter)) {
						data_value.innerText = course['course_number'];
						data_value.classList.add(CLASS_DESIGNATION_MAP[course['course_number']]);
					} else {
						data_value.classList.add("grey");
						data_value.innerText = 'X';
					}
					counter++;

					row.appendChild(data_value);
				}
				table.appendChild(row);
			}


			table.classList.add("clashed-table");
		})
	}

	/*
	
		Function to populate the course details list for each of the courses specified in data
		The details of the course that will be populated include - 
			1. course name,
			2. course number,
			3. course description,
			4. credits for course, and 
			5. instructor(s) for course

	*/
	function populate_selected_course_description_list(data) {
		document.getElementById("course-info").classList.remove("invisible");

		let list_item = document.createElement("li");
		list_item.classList.add(CLASS_DESIGNATION_MAP[data['course_number']]);

		let inner_list = document.createElement("ul");
		list_item.appendChild(inner_list);

		let course_number = document.createElement("li");

		let span = document.createElement("span");
		let u = document.createElement("u");
		let strong = document.createElement("strong");
		u.appendChild(strong);
		span.appendChild(u);
		course_number.appendChild(span);
		strong.innerText = "Course Number:";

		span = document.createElement("span");
		span.innerText = " " + data['course_number'];
		course_number.appendChild(span);
		inner_list.appendChild(course_number);

		let course_name = document.createElement("li");
		span = document.createElement("span");
		u = document.createElement("u");
		strong = document.createElement("strong");
		u.appendChild(strong);
		span.appendChild(u);
		course_name.appendChild(span);
		strong.innerText = "Course Name:";

		span = document.createElement("span");
		span.innerText = " " + data['course_name'];
		course_name.appendChild(span);
		inner_list.appendChild(course_name);

		let instructor = document.createElement("li");
		span = document.createElement("span");
		u = document.createElement("u");
		strong = document.createElement("strong");
		u.appendChild(strong);
		span.appendChild(u);
		instructor.appendChild(span);
		strong.innerText = "Course Instructor(s):";

		span = document.createElement("span");
		span.innerText = " " + data['instructor'];
		instructor.appendChild(span);
		inner_list.appendChild(instructor);

		let description = document.createElement("li");
		span = document.createElement("span");
		u = document.createElement("u");
		strong = document.createElement("strong");
		u.appendChild(strong);
		span.appendChild(u);
		description.appendChild(span);
		strong.innerText = "Course Description:";

		span = document.createElement("span");
		span.innerText = " " + data['course_description'];
		description.appendChild(span);
		inner_list.appendChild(description);

		let credits = document.createElement("li");
		span = document.createElement("span");
		u = document.createElement("u");
		strong = document.createElement("strong");
		u.appendChild(strong);
		span.appendChild(u);
		credits.appendChild(span);
		strong.innerText = "Credits for Course:";

		span = document.createElement("span");
		span.innerText = " " + data['credits'];
		credits.appendChild(span);
		inner_list.appendChild(credits);

		document.getElementById("detail-list").appendChild(list_item);
	}

	/*
	
		Function to asynchronously fetch, synchronously aggregate
		and further compute merged, if possible, schedules for each of the courses specified by the user in the drop-down list by the user
		and update the page based on the result of conflict calculation algorithm.
		COURSE_RESOLUTION_MAP is flushed and re-computed as part of this function invocation.

	*/
	function compute_schedule() {
		COURSE_RESOLUTION_MAP = {};
		document.getElementById("merged-table").innerHTML = "";
		document.getElementById("detail-list").innerHTML = "";
		let checked = document.querySelectorAll('#course-list :checked');
    	let selected = [...checked].map(option => option.value);
    	let links = [];
    	selected.forEach((course_with_name, i) => {
    		let course = course_with_name.split('-')[0].trim();
    		let course_number = course.match(/\d+/g);
    		let subject_name = course.match(/[a-zA-Z]+/g);
    		let link = BASE_URL + '?subject='+subject_name+'&course=' + course_number;
    		links.push(fetch(link));
    	})
    	Promise.all(links)
    	.then(function(responses) {
    		return Promise.all(responses.map(function (response) {
				return response.json();
			}));
    	}).then(function (all_courses) {
    		assign_css_classes_to_courses(all_courses);
    		let value = detect_conflicts_in_courses(all_courses);
    		if(value) {
    			generate_merged_table();
    			show_result_banner(true);
    		} else {
    			generate_individual_tables(all_courses);
    			show_result_banner(false);
    		}
    		all_courses.forEach((data, i) => {
				populate_selected_course_description_list(data);
			})
		}).catch(error_handling)
	}

	/*

		Function to assign a specific color to each course keeping up with the one-course-one-color theme of the website.
		This is done by mapping every course to a specific CSS class.
		The colors are randomly assigned and not repeated, so each course is guaranteed an original color.
		CLASS_DESIGNATION_MAP is re-computed as part of this function invocation.

	*/
	function assign_css_classes_to_courses(all_courses) {
		let array = [];
		all_courses.forEach((course, i) => {
			let class_found = false;
			while(!class_found) {
				let random = Math.floor(Math.random() * AVAILABLE_CLASSES.length);
				if(!array.includes(random)) {
					CLASS_DESIGNATION_MAP[course['course_number']] = AVAILABLE_CLASSES[random];
					array.push(random);
					class_found = true;
				}
			}
		});
	}

	/*

		Function to populate drop-down list of courses based on the API response received.

	*/
	function populate_courses(response) {
		response.forEach((course,i) => {
			let element = document.createElement("Option");
			element.value = course;
			element.innerText = course;
			if(i === 0) {
				element.checked = true;
			}
			document.getElementById("course-list").appendChild(element);
		});

		document.getElementById("compute-button").classList.remove("invisible");
		document.getElementById("compute-button").addEventListener("click", compute_schedule);
	}

	/*

		Function to asynchronously fetch,compute and populate the list of courses for subject specified in the drop-down list by the user
	
	*/
	function subject_change() {
		document.getElementById("course-list").innerHTML = "";
		let subject_name = document.getElementById('subject-list').value;
		let output = fetch(BASE_URL + "?subject="+subject_name + "&all=true")
		.then(checkStatus)
		.then(response => response.json())
		.then(populate_courses)
		.catch(error_handling)
	}

	/*

		Function to reset the page in the case of an error while fetching/computing different values
	
	*/
	function error_handling() {
		document.getElementById("course-list").innerHTML = "";
		document.getElementById("compute-button").classList.add("invisible");
		document.getElementById("course-info").classList.add("invisible");
		document.getElementById("detail-list").innerHTML = "";
		document.getElementById("merged-table-space").classList.add("invisible");
		document.getElementById("merged-table").innerHTML = "";
		document.getElementById("clashed-course-space").classList.add("invisible");
	}

	/*

		Function to compute the result heading banner - content and color, based on the result parameter.

	*/
	function show_result_banner(result) {
		if(result) {
			document.getElementById("conflict-result").classList.remove("invisible");
			document.getElementById("conflict-result").innerText = "Merged Schedule Created";
			document.getElementById("conflict-result").classList.remove("red-banner");
			document.getElementById("conflict-result").classList.add("green-banner");
		} else {
			document.getElementById("conflict-result").classList.remove("invisible");
			document.getElementById("conflict-result").innerText = "Conflicts Detected between selected course schedules. Individual course schedules displayed below.";
			document.getElementById("conflict-result").classList.remove("green-banner");
			document.getElementById("conflict-result").classList.add("red-banner");
		}
	}

	/*

		Function to check if the async API's response is a 200
		If not, an Error is thrown

	*/
	function checkStatus(response) {
		if (!response.ok) {
			throw Error("Error in request: " + response.status);
		}
		return response;
	}


	/*function populate_all_subjects() {
		fetch(BASE_URL + "?all=true")
		.then(checkStatus)
		.then(response => response.json())
		.then(function(subjects) {
			subjects.forEach((subject, i) => {
				let subject_option = document.createElement("option");
				subject_option.value = subject;
				subject_option.innerText = subject;
				document.getElementById("subject-list").appendChild(subject_option);
			})
		})
		.catch(error_handling)
	} */


	/*

		TO-DO: Fetch the list of subjects from the PHP API instead of hardcoding it in the HTML page.
		Will need to figure out how to dynamically add drop-down elements as well as specify an initially selected option from the dynamically added list.

	*/
	function main() {
		//populate_all_subjects();
		document.getElementById('subject-list').addEventListener("change", subject_change);
		subject_change();
	}

	window.addEventListener("load", main);
})();