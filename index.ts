import { exit } from 'process';
import * as fs from 'node:fs';

const COMMANDS = ['add', 'update', 'list', 'delete', 'mark-in-progress', 'mark-done']

enum TASK_STATUSES {
		TODO = 'todo',
		IN_PROGRESS = 'in-progress',
		DONE = 'done',
}

type Task = {
		id: number
		description: string
		status: TASK_STATUSES,
		createdAt: string
		updatedAt: string | null
}

type TaskStorage = { tasks: Task[] | null }


if (!fs.existsSync('./tasks.json')) {
		fs.writeFileSync('./tasks.json', JSON.stringify({ tasks: null }, null, 2))
}

const file = fs.readFileSync('./tasks.json', 'utf-8')
const fileObj: TaskStorage = JSON.parse(file)

function check_if_task_exists(id: Task['id']) {
		if (!fileObj.tasks) {
				return false
		}

		return fileObj.tasks.findIndex(task => task.id === id) > -1
}

function log_cli_error(commandName: string, error: string) {
		console.error(`Error: ${commandName}: ${error}`)
}

function generate_task_id() {
		if (!fileObj.tasks) {
				return 1
		}

		return fileObj.tasks.length + 1
}

function get_date_now_locale_date_string() {
		return new Date(Date.now()).toLocaleString()
}

function write_to_json(tasks: Task[]) {
		fs.writeFileSync('./tasks.json', JSON.stringify({ tasks }, null, 2))
}

function list_tasks(status?: Task['status']) {
		if (!fileObj.tasks) {
				console.info('You dont have any tasks')
				return
		}

		const tasksToPrint = status
				? fileObj.tasks.filter((task) => task.status === status)
				: fileObj.tasks

		if (status && !tasksToPrint.length) {
				console.info(`You dont have any tasks with status: ${status}`)
		}

		tasksToPrint.forEach(({ id, status, description, createdAt, updatedAt }) => {
				console.log(`${id}. ${description} (${status})`)
				console.log(`(created: ${createdAt}, last updated: ${updatedAt}\n`)
		})
}

function add_task(description: Task['description']) {
		const createdAt = get_date_now_locale_date_string()
		const status = TASK_STATUSES.TODO
		const existingTasks = fileObj.tasks || []

		const tasks: Task[] = [
				...existingTasks,
				{
						id: generate_task_id(),
						description,
						status,
						createdAt,
						updatedAt: null,
				}
		]

		write_to_json(tasks)
}

function update_task_ids(tasks: Task[]): Task[] {
		return tasks.map((task, i) => ({
				...task,
				id: i + 1
		}))
}

function update_task(id: Task['id'], description: Task['description']) {
		const updatedAt = get_date_now_locale_date_string()
		
		const existingTasks = fileObj.tasks as Task[]
		
		const updatedTasks = existingTasks.map((task) => {
				if (task.id === id) {
						return {
								...task,
								description,
								updatedAt,
						}
				}

				return task
		})

		write_to_json(updatedTasks)
}

function delete_task(id: number) {
		if (!fileObj.tasks) {
				console.info('You dont have any tasks')
				return
		}

		const updatedTasks = update_task_ids(fileObj.tasks.filter((task) => task.id !== id))
		write_to_json(updatedTasks)
}

for (let i = 2; i < process.argv.length; i++) {
		const arg = process.argv[i]
		const param1 = process.argv[i + 1]
		const param2 = process.argv[i + 2]

		switch (arg) {
				case 'add':
						if (!param1) {
								log_cli_error('ADD', 'Task description was not provided')
								exit(1)
						}

						add_task(param1)
						break

				case 'update':
						if (!param1) {
								log_cli_error('UPDATE', 'ask id was not provided')
								exit(1)
						}

						if (Number.isNaN(+param1)) {
								log_cli_error('UPDATE', 'Task id must be a number')
						}

						if (!check_if_task_exists(+param1)) {
								log_cli_error('UPDATE', `Task with id ${param1} does not exist`)
								exit(1)
						}

						if (!param2) {
								log_cli_error('UPDATE', 'Description was not provided')
								exit(1)
						}

						update_task(+param1, param2)
						break

				case 'delete':
						if (!param1) {
								log_cli_error('DELETE', 'Task id was not provided')
								exit(1)
						}

						if (Number.isNaN(+param1)) {
								log_cli_error('DELETE', 'Task id must be a number')
								exit(1)
						}

						if (!check_if_task_exists(+param1)) {
								log_cli_error('DELETE', `Task with id ${param1} does not exist`)
								exit(1)
						}

						delete_task(+param1)
						break

				case 'list':
						if (param1) {
								if (Object.values(TASK_STATUSES).includes(param1 as TASK_STATUSES)) {
										list_tasks(param1 as TASK_STATUSES)
								} else {
										log_cli_error('LIST', `Task status format is incorrect, possible values are: ${Object.values(TASK_STATUSES).join(', ')}`)
								}
						} else {
								list_tasks()
						}

				break

				default:
						exit(1)
		}
}

exit(1)
