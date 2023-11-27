import { createHash } from 'node:crypto';


export class Security {

	constructor() {
	};
	
	hashing(password: string): {hashed: string, salt: number} {
		
		const salt = Math.floor(Math.random() * 1000000000);
		const hashed = createHash('sha3-256').update(salt + password).digest('hex');
		return({hashed, salt});
	}
  
	trypassword(newPassword: string, salt:number, comparisonPassword: string) {
		const newHashedPassword = createHash('sha3-256').update(salt + newPassword).digest('hex');
		if (newHashedPassword === comparisonPassword)
			return (true);
		return (false);
	}
}

