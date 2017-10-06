import { Controller, Request, Response, Route } from '../../../../../src/core';

@Controller({
    path: '/'
})
export class RootController {

    @Route()
    main(req: Request, res: Response) {
        res.status(200).send('success');
    }

}
