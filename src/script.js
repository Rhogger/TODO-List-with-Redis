const readline = require('readline')
const redis = require('async-redis');
const { clear } = require('console');

const input = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const client = redis.createClient()

client.on('error', err => console.log('Redis Client Error', err));

let id = 1;
let nextId = id

async function setData(key, value, time = null) {
  if (time === null) {
    await client.set(String(key), value);
  } else {
    await client.set(String(key), value, 'EX', time);
  }
}

async function deleteData(key) {
  await client.del(String(key))
}

async function getAllData() {
  return new Promise((resolve) => {
    client.keys('task:*').then(keys => {
      resolve(keys);
    }).catch(err => {
      console.error(err);
    });
  });
}

async function getData(key) {
  return client.get(key)
}

function menu() {
  console.clear()
  console.log(`
  =-=-=-= TODO List with Redis =-=-=-=
  
  Options
  
  1 - Insert task
  2 - List tasks
  3 - Delete task
  
  0 - Quit
  `);
}

async function main() {
  menu()

  option = input.question('Choose an option: ', async (opt) => {

    console.log('\n');

    switch (opt) {
      case '1': {
        const task = await new Promise(setTask => {
          input.question('\nDescribe the task?\nR: ', description => {
            setTask(description)
          })
        });

        let type = await new Promise(setType => {
          input.question('\nNormal ou temporary? (N/T)\nR: ', type => {
            setType(type);
          });
        });

        let time

        if (type.toLowerCase() === 't') {
          let timeOption

          let seconds = 0
          let minutes = 0
          let hours = 0

          while (timeOption !== '0') {
            timeOption = await new Promise(setOption => {
              input.question(`
Report the time in:

1 - Hours
2 - Minutes
3 - Seconds

0 - Confirm

Choice: `, option => {
                setOption(option)
              })
            })

            switch (timeOption) {
              case '1': {
                hours = await new Promise(setTime => {
                  input.question('How many hours: ', hour => {
                    if (hour <= 0) setTime(0)
                    else setTime(hour)
                  })
                })
              }
                break

              case '2': {
                minutes = await new Promise(setTime => {
                  input.question('How many minutes: ', minutes => {
                    if (minutes <= 0) setTime(0)
                    else setTime(minutes)
                  })
                })
              }
                break

              case '3': {
                seconds = await new Promise(setTime => {
                  input.question('How many seconds: ', seconds => {
                    if (seconds <= 0) setTime(0)
                    else setTime(seconds)
                  })
                })
              }
                break
              case '0': {
                time = (Number(hours) * 60 ** 2) + (Number(minutes) * 60) + Number(seconds)

                if (time <= 0) {
                  type = 'n'
                }
              }
                break
            }
          }
        }

        try {
          id = 'task:'.concat(nextId)

          if (type.toLowerCase() === 'n') {
            await setData(id, task);
          } else {
            await setData(id, task, time);
          }
          nextId++;
          console.log('\nTask created successfully.');
        } catch (error) {
          console.error('\nError creating task:', error);
        }

        init()
      }
        break

      case '2': {
        try {
          const tasksID = await getAllData()

          console.log('ID - Task');

          for (let i = 0; i < tasksID.length; i++) {
            const key = tasksID[i].replace('task:', '')
            const value = await getData(tasksID[i])
            console.log(`${key} - ${value}`)
          }

        } catch (error) {
          console.error('Error listing tasks:', error);
        }

        init()
      }
        break

      case '3': {
        const key = await new Promise(setKey => {
          input.question('\nInforme o ID da tarefa que deseja excluir: ', key => {
            setKey('task:'.concat(key))
          })
        })

        try {
          const registers = await getAllData()

          if (client.exists(key)) {
            await deleteData(key)
            console.log('\nTask deleted successfully.\n');
          }
          else {
            console.log('Tarefa ou ID inexistente.');
          }

        } catch (error) {
          console.error('\nError delete task:', error);
        }

        init()
      }
        break

      case '0': {
        await client.quit(); // Fechando a conexão com o Redis
        input.close();
      }
    }
  })
}

function init() {
  setTimeout(() => {
    menu()
    main()
  }, 4000)
}

main()