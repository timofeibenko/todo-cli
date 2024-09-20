import { exit } from 'process';
import * as fs from 'node:fs';

enum TaskStatus {
		TODO = 'todo',
		IN_PROGRESS = 'in-progress',
		DONE = 'done',
}

type Task = {
		id: number
		description: string
		status: TaskStatus,
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

function log_bad_id_error(commandName: string) {
		log_cli_error(commandName, 'Task id must be a number')
}

function log_missing_id_error(commandName: string) {
		log_cli_error(commandName, 'Task id was not provided')
}

function run_id_expection(commandName: string, parsedId: string) {
		if (!parsedId) {
				log_missing_id_error(commandName)
				exit(1)
		}

		if (Number.isNaN(+parsedId)) {
				log_bad_id_error(commandName)
				exit(1)
		}

		if (!check_if_task_exists(+parsedId)) {
				log_cli_error(commandName, `Task does not exist`)
				exit(1)
		}
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
				console.log(`(created: ${createdAt}, last updated: ${updatedAt || '—'}\n`)
		})
}

function add_task(description: Task['description']) {
		const createdAt = get_date_now_locale_date_string()
		const status = TaskStatus.TODO
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

function change_status(id: number, status: TaskStatus) {
		if (!fileObj.tasks) {
				console.info('You dont have any tasks')
				return
		}

		const updatedTasks = fileObj.tasks.map((task) => task.id === id ? { ...task, status } : task)
		write_to_json(updatedTasks)
}

function log_help() {
		console.info('Usage:\n')

		console.info('add <task-description>')
		console.info(`Adds a task\n`)

		console.info('update <task-id> <task-description>')
		console.info(`Updates task description\n`)

		console.info('list <?status>')
		console.info('Lists all tasks. If status parameter is provided, list only the tasks in that status.')
		console.info(`Possible status values are ${Object.values(TaskStatus).join(', ')}\n`)

		console.info('delete <task-id>')
		console.info(`Deletes a task\n`)

		console.info('mark-todo <task-id>')
		console.info(`Changes task status to todo\n`)

		console.info('mark-in-progress <task-id>')
		console.info(`Changes task status to in-progress\n`)

		console.info('mark-done <task-id>')
		console.info(`Changes task status to done\n`)

		console.info(`help`)
		console.info(`Lists the list of available commands`)
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
						exit(1)

				case 'update':
						run_id_expection('UPDATE', param1)

						if (!param2) {
								log_cli_error('UPDATE', 'Task description was not provided')
								exit(1)
						}

						update_task(+param1, param2)
						exit(1)
				case 'delete':
						run_id_expection('UPDATE', param1)
						delete_task(+param1)
						exit(1)

				case 'list':
						if (param1) {
								if (Object.values(TaskStatus).includes(param1 as TaskStatus)) {
										list_tasks(param1 as TaskStatus)
								} else {
										log_cli_error('LIST', `Task status format is incorrect, possible values are: ${Object.values(TaskStatus).join(', ')}`)
								}
						} else {
								list_tasks()
						}

						exit(1)

				case 'mark-todo':
				case 'mark-in-progress':
				case 'mark-done':
						run_id_expection(arg.toUpperCase(), param1)

						let status: TaskStatus | null = null;

						if (arg === 'mark-todo') {
								status = TaskStatus.TODO
						}

						if (arg === 'mark-in-progress') {
								status = TaskStatus.IN_PROGRESS
						}

						if (arg === 'mark-done') {
								status = TaskStatus.DONE
						}

						if (!status) {
								exit(1)
						}

						change_status(+param1, status)
						exit(1)

				case 'help':
						log_help()
						exit(1)

				default:
						console.error(`Unknown argument: ${arg}\n`)
						log_help()
						exit(1)
		}
}

exit(1)
