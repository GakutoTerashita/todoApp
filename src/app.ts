import express from 'express';
import path from 'path';

class TodoListItem {
    name: string;
    description: string;
    id: string;

    constructor(name: string, description: string, id: string) {
        this.name = name;
        this.description = description;
        this.id = id;
    }
}

// 仮置きのデータ あとでデータベースに置き換える
let items: TodoListItem[] = [
    new TodoListItem('Buy groceries', 'Milk, Bread, Eggs', '1'),
    new TodoListItem('Walk the dog', 'Take the dog for a walk in the park', '2'),
    new TodoListItem('Read a book', 'Finish reading "The Great Gatsby"', '3'),
    new TodoListItem('Prepare dinner', 'Cook pasta and salad for dinner', '4'),
    new TodoListItem('Call mom', 'Check in with mom and see how she is doing', '5'),   
];

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('home', { 
        title: 'Home',
        items,
    });
});

app.post('/items/delete/:id', (req, res) => {
    const itemId = req.params.id;
    items = items.filter(item => item.id !== itemId);
    res.redirect('/'); 
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;