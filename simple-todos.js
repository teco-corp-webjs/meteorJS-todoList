Tasks = new Mongo.Collection("tasks");

/*
TODOS
X 1) Que funcione ok la primera vez que hacés click en "ocultar tareas completas"
X 2) Que los methods usen un objeto DAO
     Necesita un mapa de métodos, a lo sumo se puede definir un mapa
3) Ver si podemos poner en archivos externos los objetos de dominio (require, import, algo así)
4) Meterle 
 */
/***
 ***********************************************************
 * OBJETOS DE DOMINIO
 ***********************************************************
 */

/*jshint esnext: true */
class Tarea {
    constructor(tareaBD) {
        this.titulo = tareaBD.text;
        this.completa = tareaBD.checked;
        if (tareaBD.createdAt === undefined) {
            this.createdAt = new Date();
        } else {
            this.createdAt = tareaBD.createdAt;
        }
        this._id = tareaBD._id;
    }

    completar() {
        this.completa = true;
    }

    desmarcarCompleta() {
        this.completa = false;
    }

    chequearCompletitud() {
        if (this.completa) {
            this.desmarcarCompleta();
        } else {
            this.completar();
        }
    }

}

/***
 ***********************************************************
 * VIEW MODEL
 ***********************************************************
 */

// Principal
class ActualizarTareas {
    constructor() {
        this.ocultarTareasCompletas = this.getOcultarTareasCompletas();
        this.tituloNuevaTarea = "";
    }

    getTareas() {
        let filtro = {};
        if (this.getOcultarTareasCompletas()) {
            filtro = {
                checked: {
                    $ne: true
                }
            };
        }
        return Tasks.find(filtro, {
            sort: {
                createdAt: -1
            }
        }).map((tareaMongo) => 
            new EditarTarea(new Tarea(tareaMongo))
        );
    }

    cantidadTareasIncompletas() {
        return Tasks.find({
            checked: {
                $ne: true
            }
        }).count();
    }

    nuevaTarea() {
        Meteor.call("addTask", this.tituloNuevaTarea());
        this.tituloNuevaTarea("");
    }

    setOcultarTareasCompletas() {
        this.ocultarTareasCompletas(!this.ocultarTareasCompletas());
        Session.set("hideCompleted", this.ocultarTareasCompletas());
        this.getTareas();
    }

    getOcultarTareasCompletas() {
        let hideCompleted = Session.get("hideCompleted");
        if (hideCompleted === undefined) {
            hideCompleted = false;
        }
        return hideCompleted;
    }

}

// El de edición
class EditarTarea {
    constructor(tarea) {
        this.tarea = tarea;
    }

    eliminarTarea(idTarea) {
        Meteor.call("deleteTask", idTarea);
    }

    chequearTarea(tarea) {
        tarea.chequearCompletitud();
        Meteor.call("setChecked", tarea._id, tarea.completa);
    }
}

if (Meteor.isClient) {
    Template.body.viewmodel(new ActualizarTareas());

    Template.body.events({
        "submit .new-task": function(event) {
            // Prevent default browser form submit
            // Esto es para evitar el parpadeo y refrescar toda la página innecesariamente
            event.preventDefault();
        }
    });

}

if (Meteor.isServer) {
    Meteor.startup(function() {
        // code to run on server at startup
    });
}

var repoTareas = {
  addTask: function (text) {
    // Make sure the user is logged in before inserting a task
    /*if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }*/
    Tasks.insert({
      text: text,
      createdAt: new Date(),
      checked: false
      //,
      //owner: Meteor.userId(),
      //username: Meteor.user().username
    });
  },
  deleteTask: function (taskId) {
    Tasks.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    Tasks.update(taskId, { $set: { checked: setChecked} });
  }
};

Meteor.methods(repoTareas);

